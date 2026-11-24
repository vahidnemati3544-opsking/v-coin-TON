'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const { Pool } = require('pg');

const databaseUrl = process.env.TEST_DATABASE_URL;

async function applyTestMigrations(pool) {
  const client = await pool.connect();
  const databaseDir = path.resolve(__dirname, '../database');
  let lockAcquired = false;
  try {
    // Serialize migration setup when node:test runs integration cases in parallel.
    await client.query('SELECT pg_advisory_lock(741230017)');
    lockAcquired = true;

    const schema = await fs.readFile(path.join(databaseDir, 'schema.sql'), 'utf8');
    await client.query(schema);

    const reserveExists = await client.query(
      "SELECT to_regclass('public.mining_reserve') IS NOT NULL AS present"
    );
    if (!reserveExists.rows[0].present) {
      const reserveMigration = await fs.readFile(
        path.join(databaseDir, 'migrations/001-mining-reserve.sql'), 'utf8'
      );
      await client.query(reserveMigration);
    }

    const ledgerMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/002-mining-ledger-settlement.sql'), 'utf8'
    );
    await client.query(ledgerMigration);

    // Migration 003 predates the checksum-based setup runner and its CHECK
    // constraint is not idempotent. Reset only this test-owned constraint.
    await client.query(
      'ALTER TABLE mining_sessions DROP CONSTRAINT IF EXISTS mining_sessions_rate_balance_nonnegative'
    );
    const balanceMiningMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/003-balance-based-mining.sql'), 'utf8'
    );
    await client.query(balanceMiningMigration);

    const priceMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/004-price-reference-candles.sql'), 'utf8'
    );
    await client.query(priceMigration);

    const supplyMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/005-vcoin-supply-and-price-reset.sql'), 'utf8'
    );
    await client.query(supplyMigration);

    const annualPriceMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/006-annual-compound-price-policy.sql'), 'utf8'
    );
    await client.query(annualPriceMigration);

    const settlementMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/007-purchase-and-mining-payout-settlement.sql'), 'utf8'
    );
    await client.query(settlementMigration);

    const founderFirstMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/010-founder-first-two-stage-reconciliation.sql'), 'utf8'
    );
    await client.query(founderFirstMigration);
  } finally {
    if (lockAcquired) {
      try { await client.query('SELECT pg_advisory_unlock(741230017)'); } catch (_) { /* preserve original error */ }
    }
    client.release();
  }
}


test('purchase and payout settlement schema is idempotent and remains gated by Founder approval', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  try {
    await applyTestMigrations(pool);
    const lifecycle = await pool.query(
      'SELECT status, closed_at FROM mining_lifecycle WHERE singleton = TRUE'
    );
    assert.equal(lifecycle.rows[0].status, 'running');
    assert.equal(lifecycle.rows[0].closed_at, null);

    const telegramId = String(BigInt(Date.now()) * 10000n + BigInt(process.pid) + 7n);
    const user = await pool.query(
      "INSERT INTO users (telegram_user_id, username) VALUES ($1::bigint, 'ci_purchase_test') RETURNING id",
      [telegramId]
    );
    const userId = user.rows[0].id;
    const order = await pool.query(
      "INSERT INTO purchase_orders (" +
      "user_id, idempotency_key, network, payer_wallet_address, " +
      "beneficiary_jetton_wallet_address, founder_ton_wallet_address, " +
      "expected_ton_nano, vcoin_amount_base_units, expires_at" +
      ") VALUES ($1, $2, 'testnet', $3, $4, $5, 1000000000, 1000000, clock_timestamp() + INTERVAL '15 minutes') " +
      'RETURNING status, payment_confirmed_at, delivered_at',
      [userId, 'ci-purchase:' + randomUUID(), 'payer-test-wallet', 'beneficiary-test-jetton-wallet', 'founder-test-wallet']
    );
    assert.equal(order.rows[0].status, 'awaiting_payment');
    assert.equal(order.rows[0].payment_confirmed_at, null);
    assert.equal(order.rows[0].delivered_at, null);

    const batch = await pool.query(
      "INSERT INTO mining_payout_batches (network) VALUES ('testnet') RETURNING status"
    );
    assert.equal(batch.rows[0].status, 'draft');

    await assert.rejects(
      pool.query(
        "INSERT INTO mining_payout_batches (network, status) VALUES ('testnet', 'approved')"
      ),
      /check constraint/i
    );
  } finally {
    await pool.end();
  }
});

test('owner-approved migrations apply the 1.05B mining cap, USD 0.008 baseline, and 50% annual compound rate', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  try {
    await applyTestMigrations(pool);
    const reserve = await pool.query(
      "SELECT allocated_base_units::text FROM mining_reserve WHERE reserve_code = 'USER_MINING'"
    );
    assert.equal(reserve.rows[0].allocated_base_units, '1050000000000000');

    const price = await pool.query(
      'SELECT initial_price_usd::text, current_price_usd::text, increase_rate_percent::text FROM price_reference_state WHERE singleton = TRUE'
    );
    assert.equal(Number(price.rows[0].initial_price_usd), 0.008);
    assert.equal(Number(price.rows[0].current_price_usd), 0.008);
    assert.equal(price.rows[0].increase_rate_percent, '0.33381492');
  } finally {
    await pool.end();
  }
});


test('PostgreSQL mining reward is reserved, double-entry posted, and idempotently confirmed', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const client = await pool.connect();

  try {
    await applyTestMigrations(pool);

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
    await applyTestMigrations(pool);

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
    await pool.query(
      "INSERT INTO balances (user_id, asset_code, available_base_units) VALUES ($1, 'VCOIN', 10000000000)",
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
    const firstRewardAmount = BigInt(reward.amount_base_units);
    assert.ok(firstRewardAmount >= 5000n && firstRewardAmount < 10000n);
    assert.equal(BigInt(reward.balance_available_base_units), 10000000000n + firstRewardAmount);

    const repeatedClaim = await engine.claimReward({ userId, idempotencyKey });
    assert.equal(repeatedClaim.duplicate, true);
    assert.equal(repeatedClaim.status, 'confirmed');

    const balance = await pool.query(
      "SELECT available_base_units::text FROM balances WHERE user_id = $1 AND asset_code = 'VCOIN'",
      [userId]
    );
    assert.equal(BigInt(balance.rows[0].available_base_units), 10000000000n + firstRewardAmount);

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


test('Telegram login creates a hashed session that can be read and revoked in PostgreSQL', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  const express = require('express');
  const { createHmac } = require('node:crypto');
  const { createTelegramAuthRouter, hashSessionToken } = require('../src/auth/telegram');
  const botToken = '123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi';
  const authDate = Math.floor(Date.now() / 1000);
  const telegramId = Date.now() * 100 + (process.pid % 100);

  let server;
  try {
    await applyTestMigrations(pool);

    const values = {
      auth_date: String(authDate),
      user: JSON.stringify({
        id: telegramId,
        first_name: 'CI',
        last_name: 'Telegram',
        username: 'ci_telegram_auth',
        language_code: 'en'
      })
    };
    const checkString = Object.keys(values).sort().map((key) => key + '=' + values[key]).join('\n');
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hash = createHmac('sha256', secretKey).update(checkString).digest('hex');
    const initData = new URLSearchParams({ ...values, hash }).toString();

    const app = express();
    app.use(express.json());
    app.use('/auth', createTelegramAuthRouter({ pool, botToken, maxAgeSeconds: 300 }));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const baseUrl = 'http://127.0.0.1:' + address.port;

    const loginResponse = await fetch(baseUrl + '/auth/telegram', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData })
    });
    assert.equal(loginResponse.status, 200);
    const login = await loginResponse.json();
    assert.equal(login.token_type, 'Bearer');
    assert.ok(login.access_token);

    const stored = await pool.query(
      'SELECT token_hash FROM user_sessions WHERE user_id = $1',
      [login.user.id]
    );
    assert.equal(stored.rowCount, 1);
    assert.equal(stored.rows[0].token_hash, hashSessionToken(login.access_token));
    assert.notEqual(stored.rows[0].token_hash, login.access_token);

    const meResponse = await fetch(baseUrl + '/auth/me', {
      headers: { authorization: 'Bearer ' + login.access_token }
    });
    assert.equal(meResponse.status, 200);

    const logoutResponse = await fetch(baseUrl + '/auth/logout', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + login.access_token }
    });
    assert.equal(logoutResponse.status, 200);

    const revokedResponse = await fetch(baseUrl + '/auth/me', {
      headers: { authorization: 'Bearer ' + login.access_token }
    });
    assert.equal(revokedResponse.status, 401);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});


test('Founder-first receipt and allocation reconciliation is exact, idempotent, and rejects mismatches', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  try {
    await applyTestMigrations(pool);
    const founder = 'UQBh9jVKAypc4TrbFx2jsVB2EI1ONChg22zDputisQjENQOT';
    const master = 'EQ' + 'a'.repeat(46);
    const tx1 = randomBytes(32).toString('hex');
    const tx2 = randomBytes(32).toString('hex');
    const stage1 = '1000000000000000';
    const stage2 = '1100000000000000';

    const first = await pool.query(
      'SELECT record_vcoin_receipt_stage(1::smallint, $1::numeric, $2, $3, $4) AS status',
      [stage1, tx1, master, founder]
    );
    assert.equal(first.rows[0].status, 'confirmed');
    const duplicateFirst = await pool.query(
      'SELECT record_vcoin_receipt_stage(1, $1::numeric, $2, $3, $4) AS status',
      [stage1, tx1, master, founder]
    );
    assert.equal(duplicateFirst.rows[0].status, 'duplicate');

    await assert.rejects(
      pool.query('SELECT record_vcoin_receipt_stage(2::smallint, $1::numeric, $2, $3, $4)', [
        '1099999999999999', tx2, master, founder
      ]),
      /exact remaining supply/i
    );

    const second = await pool.query(
      'SELECT record_vcoin_receipt_stage(2, $1::numeric, $2, $3, $4) AS status',
      [stage2, tx2, master, founder]
    );
    assert.equal(second.rows[0].status, 'confirmed');

    const miningHash = randomBytes(32).toString('hex');
    const miningDestination = 'UQDMEIvklqeBW0Pn74sBHzOpoFGsSWDHE5NxZwfN-1KVsBD0';
    const mining = await pool.query(
      'SELECT record_vcoin_allocation_transfer($1, $2::numeric, $3, $4, $5) AS status',
      ['mining_reserve', '1050000000000000', miningHash, founder, miningDestination]
    );
    assert.equal(mining.rows[0].status, 'confirmed');
    const duplicateMining = await pool.query(
      'SELECT record_vcoin_allocation_transfer($1, $2::numeric, $3, $4, $5) AS status',
      ['mining_reserve', '1050000000000000', miningHash, founder, miningDestination]
    );
    assert.equal(duplicateMining.rows[0].status, 'duplicate');

    await assert.rejects(
      pool.query(
        'SELECT record_vcoin_allocation_transfer($1, $2::numeric, $3, $4, $5)',
        ['treasury', '210000000000001', randomBytes(32).toString('hex'), founder,
          'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ']
      ),
      /approved role amount/i
    );
    await assert.rejects(
      pool.query(
        'SELECT record_vcoin_allocation_transfer($1, $2::numeric, $3, $4, $5)',
        ['treasury', '210000000000000', randomBytes(32).toString('hex'), founder,
          miningDestination]
      ),
      /registered wallet/i
    );

    const otherTransfers = [
      ['treasury', '210000000000000', 'UQBEW5bLGbq0yVDOimgl6fpZbQkdla9Wk5b0tXyx69bmBktQ'],
      ['liquidity_market', '210000000000000', 'UQA0_thi3mXZ6jFlHHBfnyjVmXayR3hsGx5PC43_fBOTzXWn'],
      ['ecosystem_marketing', '210000000000000', 'UQBQDb73DWWMGnxEr37TsqZSKNvVOC9MMwkvRmNY91LJqLsE'],
    ];
    for (const [role, amount, destination] of otherTransfers) {
      const result = await pool.query(
        'SELECT record_vcoin_allocation_transfer($1, $2::numeric, $3, $4, $5) AS status',
        [role, amount, randomBytes(32).toString('hex'), founder, destination]
      );
      assert.equal(result.rows[0].status, 'confirmed');
    }

    const reconciliation = await pool.query('SELECT * FROM vcoin_founder_first_reconciliation');
    assert.equal(reconciliation.rows[0].confirmed_receipt_base_units, '2100000000000000');
    assert.equal(reconciliation.rows[0].founder_signed_distributions_base_units, '1680000000000000');
    assert.equal(reconciliation.rows[0].confirmed_distribution_count, 4);
    assert.equal(reconciliation.rows[0].full_supply_receipt_confirmed, true);
  } finally {
    await pool.end();
  }
});
