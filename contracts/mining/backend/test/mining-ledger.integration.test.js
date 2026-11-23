'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
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

    const walletSnapshotMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/008-wallet-snapshots-and-offline-mining.sql'), 'utf8'
    );
    await client.query(walletSnapshotMigration);

    const allocationMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/009-21b-vcoin-allocation-baseline.sql'), 'utf8'
    );
    await client.query(allocationMigration);

    const tonProofMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/010-ton-proof-challenges.sql'), 'utf8'
    );
    await client.query(tonProofMigration);

    const walletChainMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/011-wallet-chain-separation.sql'), 'utf8'
    );
    await client.query(walletChainMigration);

    const walletMiningMigration = await fs.readFile(
      path.join(databaseDir, 'migrations/012-wallet-backed-mining-basis.sql'), 'utf8'
    );
    await client.query(walletMiningMigration);
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

test('owner-approved migrations apply the 1.05B mining cap, USD 0.004 baseline, and 50% annual compound rate', {
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
    assert.equal(Number(price.rows[0].initial_price_usd), 0.004);
    assert.equal(Number(price.rows[0].current_price_usd), 0.004);
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


test('wallet-backed mining accrues from finalized Jetton snapshots and settles to the internal ledger', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  try {
    await applyTestMigrations(pool);
    const { createWalletMiningEngine } = require('../src/services/wallet-mining-engine');

    await pool.query(
      'INSERT INTO levels (level, upgrade_cost_base_units, mining_rate_base_units_per_second) ' +
      'VALUES (1, 0, 0) ON CONFLICT (level) DO NOTHING'
    );

    const telegramId = String(BigInt(Date.now()) * 10000n + BigInt(process.pid) + 88n);
    const userResult = await pool.query(
      "INSERT INTO users (telegram_user_id, username) VALUES ($1::bigint, 'ci_wallet_mining_test') RETURNING id",
      [telegramId]
    );
    const userId = userResult.rows[0].id;
    await pool.query(
      'INSERT INTO user_levels (user_id, current_level) VALUES ($1, 1)',
      [userId]
    );

    const owner = '0:' + 'a'.repeat(64);
    const master = '0:' + 'b'.repeat(64);
    const jettonWallet = '0:' + 'c'.repeat(64);
    const walletResult = await pool.query(
      "INSERT INTO wallets (user_id, network, chain_global_id, wallet_address, is_verified) " +
      "VALUES ($1, 'TON', '-239', $2, TRUE) RETURNING id",
      [userId, owner]
    );
    const walletId = walletResult.rows[0].id;

    async function insertSnapshot(balance) {
      const hash = require('node:crypto').createHash('sha256').update(randomUUID()).digest('hex');
      const result = await pool.query(
        'INSERT INTO jetton_wallet_balance_snapshots ' +
        '(wallet_id, network, jetton_master_address, owner_wallet_address, jetton_wallet_address, ' +
        'balance_base_units, chain_block_seqno, source, observed_at, finalized_at, is_final, source_payload_sha256) ' +
        "VALUES ($1, 'mainnet', $2, $3, $4, $5::numeric, 100, 'test_fixture', clock_timestamp(), clock_timestamp(), TRUE, $6) " +
        'RETURNING id',
        [walletId, master, owner, jettonWallet, balance, hash]
      );
      return result.rows[0].id;
    }

    const startSnapshotId = await insertSnapshot('1000000000000');
    const engine = createWalletMiningEngine({ pool });
    const session = await engine.startSession({
      userId,
      network: 'mainnet',
      snapshotId: startSnapshotId
    });
    assert.ok(session.rate_wallet_snapshot_id);
    assert.equal(session.wallet_chain_global_id, '-239');

    await pool.query(
      "UPDATE mining_sessions SET last_claim_at = clock_timestamp() - INTERVAL '60 seconds' WHERE id = $1",
      [session.id]
    );
    const endSnapshotId = await insertSnapshot('900000000000');
    const idempotencyKey = 'wallet-engine-claim:' + randomUUID();
    const reward = await engine.claimReward({
      userId,
      network: 'mainnet',
      snapshotId: endSnapshotId,
      idempotencyKey
    });

    assert.equal(reward.status, 'confirmed');
    assert.equal(reward.start_wallet_snapshot_id, startSnapshotId);
    assert.equal(reward.end_wallet_snapshot_id, endSnapshotId);
    assert.equal(String(reward.eligible_wallet_balance_base_units), '900000000000');
    assert.ok(BigInt(reward.amount_base_units) >= 6000000n);
    assert.ok(BigInt(reward.amount_base_units) <= 12000000n);

    const duplicate = await engine.claimReward({
      userId,
      network: 'mainnet',
      snapshotId: endSnapshotId,
      idempotencyKey
    });
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.status, 'confirmed');

    const sessionAfterClaim = await pool.query(
      'SELECT rate_wallet_snapshot_id, rate_balance_base_units::text AS rate_balance_base_units ' +
      'FROM mining_sessions WHERE id = $1',
      [session.id]
    );
    assert.equal(sessionAfterClaim.rows[0].rate_wallet_snapshot_id, endSnapshotId);
    assert.equal(sessionAfterClaim.rows[0].rate_balance_base_units, '900000000000');

    const ledger = await pool.query(
      "SELECT available_base_units::text FROM balances WHERE user_id = $1 AND asset_code = 'VCOIN'",
      [userId]
    );
    assert.equal(BigInt(ledger.rows[0].available_base_units), BigInt(reward.amount_base_units));
  } finally {
    await pool.end();
  }
});

test('wallet-backed mining refuses a stale chain snapshot and does not accrue from internal balances', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  try {
    await applyTestMigrations(pool);
    const { createWalletMiningEngine } = require('../src/services/wallet-mining-engine');

    await pool.query(
      'INSERT INTO levels (level, upgrade_cost_base_units, mining_rate_base_units_per_second) ' +
      'VALUES (1, 0, 0) ON CONFLICT (level) DO NOTHING'
    );
    const telegramId = String(BigInt(Date.now()) * 10000n + BigInt(process.pid) + 89n);
    const userResult = await pool.query(
      "INSERT INTO users (telegram_user_id, username) VALUES ($1::bigint, 'ci_wallet_stale_test') RETURNING id",
      [telegramId]
    );
    const userId = userResult.rows[0].id;
    await pool.query('INSERT INTO user_levels (user_id, current_level) VALUES ($1, 1)', [userId]);
    await pool.query(
      "INSERT INTO balances (user_id, asset_code, available_base_units) VALUES ($1, 'VCOIN', 999999999999)",
      [userId]
    );

    const owner = '0:' + 'd'.repeat(64);
    const master = '0:' + 'e'.repeat(64);
    const jettonWallet = '0:' + 'f'.repeat(64);
    const walletResult = await pool.query(
      "INSERT INTO wallets (user_id, network, chain_global_id, wallet_address, is_verified) " +
      "VALUES ($1, 'TON', '-239', $2, TRUE) RETURNING id",
      [userId, owner]
    );
    const hash = require('node:crypto').createHash('sha256').update(randomUUID()).digest('hex');
    const staleSnapshot = await pool.query(
      'INSERT INTO jetton_wallet_balance_snapshots ' +
      '(wallet_id, network, jetton_master_address, owner_wallet_address, jetton_wallet_address, ' +
      'balance_base_units, chain_block_seqno, source, observed_at, finalized_at, is_final, source_payload_sha256) ' +
      "VALUES ($1, 'mainnet', $2, $3, $4, 1000000000000, 100, 'test_fixture', " +
      "clock_timestamp() - INTERVAL '10 minutes', clock_timestamp(), TRUE, $5) RETURNING id",
      [walletResult.rows[0].id, master, owner, jettonWallet, hash]
    );

    const engine = createWalletMiningEngine({ pool });
    await assert.rejects(
      engine.startSession({ userId, network: 'mainnet', snapshotId: staleSnapshot.rows[0].id }),
      (error) => error.code === 'WALLET_SNAPSHOT_STALE_OR_INVALID'
    );
    const sessions = await pool.query('SELECT COUNT(*)::integer AS count FROM mining_sessions WHERE user_id = $1', [userId]);
    assert.equal(sessions.rows[0].count, 0);
  } finally {
    await pool.end();
  }
});


test('TON proof challenges are session-bound, single-use, and cannot silently replace a verified Mainnet wallet', {
  skip: !databaseUrl
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  try {
    await applyTestMigrations(pool);
    const { generateKeyPairSync, sign, createHash } = require('node:crypto');
    const { WalletContractV4 } = require('@ton/ton');
    const { beginCell, storeStateInit } = require('@ton/core');
    const { createTonProofService, buildTonProofDigest, TonProofError } = require('../src/services/ton-proof');

    const telegramId = String(BigInt(Date.now()) * 10000n + BigInt(process.pid) + 90n);
    const userResult = await pool.query(
      "INSERT INTO users (telegram_user_id, username) VALUES ($1::bigint, 'ci_ton_proof_test') RETURNING id",
      [telegramId]
    );
    const userId = userResult.rows[0].id;
    const tokenHash = createHash('sha256').update(randomUUID()).digest('hex');
    const sessionResult = await pool.query(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at) ' +
      "VALUES ($1, $2, clock_timestamp() + INTERVAL '1 hour') RETURNING id",
      [userId, tokenHash]
    );
    const sessionId = sessionResult.rows[0].id;
    const service = createTonProofService({ pool, expectedDomain: 'app.example.com' });

    async function signedWalletProof(payload) {
      const keyPair = generateKeyPairSync('ed25519');
      const spki = keyPair.publicKey.export({ format: 'der', type: 'spki' });
      const publicKey = spki.subarray(spki.length - 32);
      const wallet = WalletContractV4.create({ workchain: 0, publicKey });
      const walletStateInit = beginCell().store(storeStateInit(wallet.init)).endCell().toBoc().toString('base64');
      const nowSeconds = Math.floor(Date.now() / 1000);
      const proof = {
        timestamp: nowSeconds,
        domain: { lengthBytes: Buffer.byteLength('app.example.com', 'utf8'), value: 'app.example.com' },
        payload
      };
      proof.signature = sign(null, buildTonProofDigest(wallet.address, proof), keyPair.privateKey).toString('base64');
      return {
        address: wallet.address.toString({ bounceable: true, urlSafe: true }),
        network: '-239',
        walletStateInit,
        publicKey: publicKey.toString('hex'),
        proof
      };
    }

    const challenge = await service.createChallenge({ userId, sessionId, network: 'mainnet' });
    const firstProof = await signedWalletProof(challenge.payload);
    const verified = await service.verifyAndBind({ userId, sessionId, input: firstProof });
    assert.equal(verified.walletVerified, true);
    assert.equal(verified.network, 'mainnet');

    const storedWallet = await pool.query(
      "SELECT wallet_address, chain_global_id, is_verified FROM wallets " +
      "WHERE user_id = $1 AND network = 'TON' AND chain_global_id = '-239'",
      [userId]
    );
    assert.equal(storedWallet.rowCount, 1);
    assert.equal(storedWallet.rows[0].wallet_address, verified.walletAddress);
    assert.equal(storedWallet.rows[0].is_verified, true);

    await assert.rejects(
      service.verifyAndBind({ userId, sessionId, input: firstProof }),
      (error) => error instanceof TonProofError && error.code === 'TON_PROOF_CHALLENGE_INVALID'
    );

    const replacementChallenge = await service.createChallenge({ userId, sessionId, network: 'mainnet' });
    const replacementProof = await signedWalletProof(replacementChallenge.payload);
    await assert.rejects(
      service.verifyAndBind({ userId, sessionId, input: replacementProof }),
      (error) => error instanceof TonProofError && error.code === 'WALLET_ALREADY_BOUND'
    );

    const replacementChallengeRow = await pool.query(
      'SELECT consumed_at FROM ton_proof_challenges WHERE payload_sha256 = $1',
      [createHash('sha256').update(replacementChallenge.payload).digest('hex')]
    );
    assert.equal(replacementChallengeRow.rows[0].consumed_at, null);
  } finally {
    await pool.end();
  }
});
