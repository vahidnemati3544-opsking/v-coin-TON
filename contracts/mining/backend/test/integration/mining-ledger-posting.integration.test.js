'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');

const databaseConfigured = Boolean(process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER);

test('PostgreSQL migrations post mining rewards exactly once and enforce retry keys', {
  skip: !databaseConfigured && 'PostgreSQL environment is not configured'
}, async () => {
  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 3
  });

  const backendRoot = path.resolve(__dirname, '../..');
  const readSql = (relativePath) => fs.readFileSync(path.join(backendRoot, relativePath), 'utf8');

  try {
    await pool.query(readSql('database/schema.sql'));
    await pool.query(readSql('database/migrations/001-miming-reserve.sql'));
    await pool.query(readSql('database/migrations/002-mining-ledger-posting.sql'));

    const userId = randomUUID();
    const sessionId = randomUUID();
    const rewardId = randomUUID();
    const ledgerOperationId = randomUUID();
    const amount = '1250000';
    const reserveKey = 'integration-reserve-' + randomUUID();
    const confirmationKey = 'integration-confirm-' + randomUUID();

    await pool.query('INSERT INTO users (id, account_status) VALUES ($1, $2)', [userId, 'active']);
    await pool.query(
      "INSERT INTO mining_sessions (id, user_id, status) VALUES ($1, $2, 'active')",
      [sessionId, userId]
    );

    await pool.query('SELECT * FROM reserve_mining_reward($1, $2::numeric, $3)', [rewardId, amount, reserveKey]);
    await pool.query(
      "INSERT INTO mining_rewards (id, user_id, session_id, amount_base_units, reward_type, operation_id, idempotency_key, status) VALUES ($1, $2, $3, $4::numeric, 'mining', $5, $6, 'pending')",
      [rewardId, userId, sessionId, amount, ledgerOperationId, reserveKey]
    );

    const first = await pool.query('SELECT * FROM post_mining_reward($1, $2)', [rewardId, confirmationKey]);
    assert.equal(first.rowCount, 1);
    assert.equal(first.rows[0].result_status, 'posted');
    assert.equal(first.rows[0].result_user_id, userId);
    assert.equal(String(first.rows[0].result_amount_base_units), amount);

    const retry = await pool.query('SELECT * FROM post_mining_reward($1, $2)', [rewardId, confirmationKey]);
    assert.equal(retry.rows[0].result_ledger_transaction_id, first.rows[0].result_ledger_transaction_id);

    await assert.rejects(
      () => pool.query('SELECT * FROM post_mining_reward($1, $2)', [rewardId, 'different-confirmation-key']),
      /original confirmation operation key/
    );

    const ledger = await pool.query(
      "SELECT COUNT(*)::int AS entry_count, SUM(amount_base_units) FILTER (WHERE entry_side = 'debit')::text AS debits, SUM(amount_base_units) FILTER (WHERE entry_side = 'credit')::text AS credits FROM ledger_entries WHERE transaction_id = $1",
      [first.rows[0].result_ledger_transaction_id]
    );
    assert.equal(ledger.rows[0].entry_count, 2);
    assert.equal(ledger.rows[0].debits, amount);
    assert.equal(ledger.rows[0].credits, amount);

    const balance = await pool.query(
      'SELECT available_base_units::text FROM balances WHERE user_id = $1 AND asset_code = $2',
      [userId, 'VCOIN']
    );
    assert.equal(balance.rows[0].available_base_units, amount);

    const counts = await pool.query(
      'SELECT (SELECT COUNT(*)::int FROM ledger_transactions WHERE operation_id = $1) AS transactions, (SELECT COUNT(*)::int FROM ledger_entries WHERE transaction_id = $2) AS entries',
      [ledgerOperationId, first.rows[0].result_ledger_transaction_id]
    );
    assert.equal(counts.rows[0].transactions, 1);
    assert.equal(counts.rows[0].entries, 2);

    const reserve = await pool.query(
      "SELECT pending_base_units::text, distributed_base_units::text FROM mining_reserve WHERE reserve_code = 'USER_MINING'"
    );
    assert.equal(reserve.rows[0].pending_base_units, '0');
    assert.equal(reserve.rows[0].distributed_base_units, amount);
  } finally {
    await pool.end();
  }
});
