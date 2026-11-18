'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');

const databaseUrl = process.env.TEST_DATABASE_URL;

test('PostgreSQL mining reward is reserved, double-entry posted, and idempotently confirmed', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const client = await pool.connect();

  try {
    const databaseDir = path.resolve(__dirname, '../database');
    const schema = await fs.readFile(path.join(databaseDir, 'schema.sql'), 'utf8');
    const reserveMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/001-mining-reserve.sql'), 'utf8'
    );
    const ledgerMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/002-mining-ledger-settlement.sql'), 'utf8'
    );

    await client.query(schema);
    await client.query(reserveMigration);
    await client.query(ledgerMigration);

    await client.query('BEGIN');

    const telegramId = String(BigInt(Date.now()) * 10000n + BigInt(process.pid));
    const userResult = await client.query(
      "INSERT INTO users (telegram_user_id, username) VALUES ($1::bigint, 'ci_mining_test') RETURNING id",
      [telegramId]
    );
    const userId = userResult.rows[0].id;
    const sessionResult = await client.query(
      "INSERT INTO mining_sessions (user_id, status) VALUES ($1, 'active') RETURNING id",
      [userId]
    );

    const rewardId = randomUUID();
    const operationId = randomUUID();
    const idempotencyKey = 'ci-mining:' + randomUUID();
    const amount = '1250000';

    await client.query(
      "INSERT INTO mining_rewards (id, user_id, session_id, amount_base_units, reward_type, operation_id, idempotency_key, status) " +
      "VALUES ($1, $2, $3, $4::numeric, 'mining', $5, $6, 'pending')",
      [rewardId, userId, sessionResult.rows[0].id, amount, operationId, idempotencyKey]
    );

    const reserve = await client.query(
      'SELECT * FROM reserve_mining_reward($1, $2::numeric, $3)',
      [rewardId, amount, idempotencyKey]
    );
    assert.equal(reserve.rows[0].result_status, 'pending');
    assert.equal(String(reserve.rows[0].result_amount_base_units), amount);

    const confirmKey = 'confirm:' + idempotencyKey;
    const confirmed = await client.query(
      'SELECT * FROM confirm_mining_reward_to_internal_balance($1, $2)',
      [rewardId, confirmKey]
    );
    assert.equal(confirmed.rows[0].result_status, 'confirmed');
    assert.equal(String(confirmed.rows[0].result_balance_base_units), amount);

    const ledger = await client.query(
      'SELECT COUNT(*)::integer AS entry_count, ' +
      "COALESCE(SUM(amount_base_units) FILTER (WHERE entry_side = 'debit'), 0)::text AS debit_total, " +
      "COALESCE(SUM(amount_base_units) FILTER (WHERE entry_side = 'credit'), 0)::text AS credit_total " +
      'FROM ledger_entries WHERE transaction_id = (' +
      'SELECT id FROM ledger_transactions WHERE operation_id = $1)',
      [operationId]
    );
    assert.equal(ledger.rows[0].entry_count, 2);
    assert.equal(ledger.rows[0].debit_total, amount);
    assert.equal(ledger.rows[0].credit_total, amount);

    const duplicate = await client.query(
      'SELECT * FROM confirm_mining_reward_to_internal_balance($1, $2)',
      [rewardId, confirmKey]
    );
    assert.equal(duplicate.rows[0].result_status, 'duplicate');
    assert.equal(String(duplicate.rows[0].result_balance_base_units), amount);

    const reserveStatus = await client.query(
      "SELECT pending_base_units::text, distributed_base_units::text " +
      "FROM mining_reserve WHERE reserve_code = 'USER_MINING'"
    );
    assert.equal(reserveStatus.rows[0].pending_base_units, '0');
    assert.equal(reserveStatus.rows[0].distributed_base_units, amount);
  } finally {
    try { await client.query('ROLLBACK'); } catch (_) { /* transaction may not have started */ }
    client.release();
    await pool.end();
  }
});


test('mining engine claim settles internal balance and repeated start/claim are safe', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  try {
    const databaseDir = path.resolve(__dirname, '../database');
    await pool.query(await fs.readFile(path.join(databaseDir, 'schema.sql'), 'utf8'));
    await pool.query(await fs.readFile(path.join(databaseDir, 'migrations/001-mining-reserve.sql'), 'utf8'));
    await pool.query(await fs.readFile(path.join(databaseDir, 'migrations/002-mining-ledger-settlement.sql'), 'utf8'));

    const { createMiningEngine } = require('../../engine');
    await pool.query(
      'INSERT INTO levels (level, upgrade_cost_base_units, mining_rate_base_units_per_second) ' +
      'VALUES (1, 0, 1000) ON CONFLICT (level) DO UPDATE ' +
      'SET mining_rate_base_units_per_second = EXCLUDED.mining_rate_base_units_per_second'
    );

    const telegramId = String(BigInt(Date.now()) * 10000n + BigInt(process.pid) + 1n);
    const userResult = await pool.query(
      "INSERT INTO users (telegram_user_id, username) VALUES ($1::bigint, 'ci_engine_test') RETURNING id",
      [telegramId]
    );
    const userId = userResult.rows[0].id;
    await pool.query(
      'INSERT INTO user_levels (user_id, current_level) VALUES ($1, 1)',
      [userId]
    );

    const engine = createMiningEngine({ pool });
    const session = await engine.startSession({ userId });
    const repeatedStart = await engine.startSession({ userId });
    assert.equal(repeatedStart.id, session.id);
    assert.equal(repeatedStart.duplicate, true);

    await pool.query(
      "UPDATE mining_sessions SET last_claim_at = clock_timestamp() - INTERVAL '5 seconds' WHERE id = $1",
      [session.id]
    );

    const idempotencyKey = 'engine-claim:' + randomUUID();
    const reward = await engine.claimReward({ userId, idempotencyKey });
    assert.equal(reward.status, 'confirmed');
    assert.equal(String(reward.amount_base_units), '5000');
    assert.equal(String(reward.balance_available_base_units), '5000');

    const repeatedClaim = await engine.claimReward({ userId, idempotencyKey });
    assert.equal(repeatedClaim.duplicate, true);
    assert.equal(repeatedClaim.status, 'confirmed');

    const balance = await pool.query(
      "SELECT available_base_units::text FROM balances WHERE user_id = $1 AND asset_code = 'VCOIN'",
      [userId]
    );
    assert.equal(balance.rows[0].available_base_units, '5000');

    await pool.query(
      "UPDATE mining_sessions SET last_claim_at = clock_timestamp() - INTERVAL '5 seconds' WHERE id = $1",
      [session.id]
    );
    const ended = await engine.endSession({
      userId,
      sessionId: session.id,
      finalClaimIdempotencyKey: 'engine-end:' + randomUUID()
    });
    assert.equal(ended.session.status, 'completed');
    assert.equal(ended.finalReward.status, 'confirmed');
  } finally {
    await pool.end();
  }
});
