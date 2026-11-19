'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  WalletSnapshotError,
  createWalletBalanceSnapshotService
} = require('../src/services/wallet-balance-snapshot');

const nowMs = Date.parse('2026-11-20T00:00:00.000Z');
const owner = '0:' + '11'.repeat(32);
const master = '0:' + '22'.repeat(32);
const jettonWallet = '0:' + '33'.repeat(32);

function verifiedWallet(overrides = {}) {
  return {
    id: 'wallet-1',
    user_id: 'user-1',
    wallet_address: owner,
    chain_network: 'testnet',
    is_verified: true,
    proof_verified_at: '2026-11-19T00:00:00.000Z',
    proof_expires_at: '2026-12-20T00:00:00.000Z',
    revoked_at: null,
    ...overrides
  };
}

function verifiedSnapshot(overrides = {}) {
  return {
    network: 'testnet',
    ownerAddress: owner,
    masterAddress: master,
    jettonWalletAddress: jettonWallet,
    balanceBaseUnits: '5000000000000',
    lastTransactionLt: '123456',
    indexerMasterchainSeqno: '7890',
    indexerBlockUtime: Math.floor(nowMs / 1000) - 5,
    indexerLagSeconds: 5,
    observedAt: new Date(nowMs).toISOString(),
    source: 'toncenter-v3-indexer',
    ...overrides
  };
}

function mockPool({ initialWallet = verifiedWallet(), lockedWallet = initialWallet, insertedRows = null, existingRows = [] } = {}) {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ scope: 'client', sql, params });
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM wallets') && sql.includes('FOR UPDATE')) {
        return { rows: lockedWallet ? [lockedWallet] : [] };
      }
      if (sql.includes('INSERT INTO wallet_balance_snapshots')) {
        return { rows: insertedRows === null ? [{
          id: 'snapshot-1',
          wallet_id: 'wallet-1',
          chain_network: 'testnet',
          master_address: master,
          jetton_wallet_address: jettonWallet,
          balance_base_units: '5000000000000',
          last_transaction_lt: '123456',
          indexer_masterchain_seqno: '7890',
          indexer_block_utime: Math.floor(nowMs / 1000) - 5,
          indexer_lag_seconds: 5,
          source: 'toncenter-v3-indexer',
          source_payload_hash: 'a'.repeat(64),
          observed_at: new Date(nowMs).toISOString()
        }] : insertedRows };
      }
      throw new Error('Unexpected client query: ' + sql);
    },
    release() {
      calls.push({ scope: 'client', sql: 'RELEASE' });
    }
  };

  const pool = {
    calls,
    async query(sql, params) {
      calls.push({ scope: 'pool', sql, params });
      if (sql.includes('FROM wallets')) {
        return { rows: initialWallet ? [initialWallet] : [] };
      }
      if (sql.includes('FROM wallet_balance_snapshots')) {
        return { rows: existingRows };
      }
      throw new Error('Unexpected pool query: ' + sql);
    },
    async connect() {
      return client;
    }
  };
  return pool;
}

test('snapshot service persists only a fresh, identity-matched verified wallet snapshot', async () => {
  const pool = mockPool();
  const provider = { getVerifiedBalance: async () => verifiedSnapshot() };
  const service = createWalletBalanceSnapshotService({
    pool,
    provider,
    expectedNetwork: 'testnet',
    expectedMasterAddress: master,
    now: () => nowMs
  });

  const row = await service.captureSnapshot({ userId: 'user-1', walletId: 'wallet-1' });
  assert.equal(row.id, 'snapshot-1');
  assert.equal(row.wallet_id, 'wallet-1');
  assert.equal(row.balance_base_units, '5000000000000');
  assert.equal(pool.calls.some((call) => call.sql === 'COMMIT'), true);
  assert.equal(pool.calls.some((call) => call.sql === 'RELEASE'), true);
});

test('snapshot service rejects unverified, expired and revoked wallet links before provider access', async () => {
  for (const wallet of [
    verifiedWallet({ is_verified: false, proof_verified_at: null }),
    verifiedWallet({ proof_expires_at: '2026-11-19T23:59:59.000Z' }),
    verifiedWallet({ revoked_at: '2026-11-19T23:00:00.000Z' })
  ]) {
    let providerCalls = 0;
    const service = createWalletBalanceSnapshotService({
      pool: mockPool({ initialWallet: wallet }),
      provider: { getVerifiedBalance: async () => { providerCalls += 1; return verifiedSnapshot(); } },
      expectedNetwork: 'testnet',
      expectedMasterAddress: master,
      now: () => nowMs
    });
    await assert.rejects(
      service.captureSnapshot({ userId: 'user-1', walletId: 'wallet-1' }),
      WalletSnapshotError
    );
    assert.equal(providerCalls, 0);
  }
});

test('snapshot service rejects wrong network, owner, Master, source and stale observations', async () => {
  const cases = [
    { expectedNetwork: 'mainnet', snapshot: verifiedSnapshot() },
    { expectedNetwork: 'testnet', snapshot: verifiedSnapshot({ ownerAddress: '0:' + '44'.repeat(32) }) },
    { expectedNetwork: 'testnet', snapshot: verifiedSnapshot({ masterAddress: '0:' + '55'.repeat(32) }) },
    { expectedNetwork: 'testnet', snapshot: verifiedSnapshot({ source: 'untrusted-source' }) },
    { expectedNetwork: 'testnet', snapshot: verifiedSnapshot({ observedAt: '2026-11-19T23:00:00.000Z' }) }
  ];

  for (const item of cases) {
    const service = createWalletBalanceSnapshotService({
      pool: mockPool(),
      provider: { getVerifiedBalance: async () => item.snapshot },
      expectedNetwork: item.expectedNetwork,
      expectedMasterAddress: master,
      now: () => nowMs,
      maxSnapshotAgeSeconds: 30
    });
    await assert.rejects(
      service.captureSnapshot({ userId: 'user-1', walletId: 'wallet-1' }),
      WalletSnapshotError
    );
  }
});

test('snapshot service rechecks revocation under lock and rolls back on a race', async () => {
  const pool = mockPool({
    initialWallet: verifiedWallet(),
    lockedWallet: verifiedWallet({ revoked_at: '2026-11-20T00:00:01.000Z' })
  });
  const service = createWalletBalanceSnapshotService({
    pool,
    provider: { getVerifiedBalance: async () => verifiedSnapshot() },
    expectedNetwork: 'testnet',
    expectedMasterAddress: master,
    now: () => nowMs
  });

  await assert.rejects(
    service.captureSnapshot({ userId: 'user-1', walletId: 'wallet-1' }),
    (error) => error.code === 'WALLET_LINK_REVOKED'
  );
  assert.equal(pool.calls.some((call) => call.sql === 'ROLLBACK'), true);
  assert.equal(pool.calls.some((call) => call.sql.includes('INSERT INTO wallet_balance_snapshots')), false);
});

test('snapshot service returns the already persisted row for an idempotent duplicate snapshot', async () => {
  const existing = { id: 'snapshot-existing', wallet_id: 'wallet-1', balance_base_units: '5000000000000' };
  const pool = mockPool({ insertedRows: [], existingRows: [existing] });
  const service = createWalletBalanceSnapshotService({
    pool,
    provider: { getVerifiedBalance: async () => verifiedSnapshot() },
    expectedNetwork: 'testnet',
    expectedMasterAddress: master,
    now: () => nowMs
  });

  const row = await service.captureSnapshot({ userId: 'user-1', walletId: 'wallet-1' });
  assert.equal(row.id, 'snapshot-existing');
});
