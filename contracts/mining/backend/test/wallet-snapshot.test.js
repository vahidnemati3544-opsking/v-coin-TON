'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Address } = require('@ton/ton');
const { createWalletSnapshotService } = require('../src/services/wallet-snapshot');
const { createTonRpcProvider, TonRpcError } = require('../src/services/ton-rpc-provider');

const owner = '0:' + '1'.repeat(64);
const master = '0:' + '2'.repeat(64);
const jettonWallet = '0:' + '3'.repeat(64);
const now = Date.parse('2026-11-23T09:00:00.000Z');

test('wallet snapshot service reads only the authenticated user verified wallet and persists the chain snapshot', async () => {
  let insertedValues;
  const pool = {
    async query(sql, values) {
      assert.match(sql, /is_verified = TRUE/);
      assert.deepEqual(values, ['user-1', '-239']);
      return { rowCount: 1, rows: [{ id: 'wallet-row-1', wallet_address: owner }] };
    },
    async connect() {
      return {
        async query(sql, values) {
          if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rowCount: 0, rows: [] };
          assert.match(sql, /INSERT INTO jetton_wallet_balance_snapshots/);
          insertedValues = values;
          return { rowCount: 1, rows: [{ id: 'snapshot-1' }] };
        },
        release() {}
      };
    }
  };
  const service = createWalletSnapshotService({
    pool,
    jettonMasterAddress: master,
    now: () => now,
    providerFactory(network) {
      assert.equal(network, 'mainnet');
      return {
        async getJettonWalletAddress(address, context) {
          assert.equal(address, owner);
          assert.equal(context.network, 'mainnet');
          return jettonWallet;
        },
        async getJettonWalletData(address) {
          assert.equal(address, jettonWallet);
          return {
            ownerAddress: owner,
            jettonMasterAddress: master,
            balanceBaseUnits: '2100000000000000',
            blockSeqno: 123456,
            observedAt: new Date(now - 1000).toISOString(),
            isFinal: true
          };
        }
      };
    }
  });

  const snapshot = await service.capture({ userId: 'user-1', network: 'mainnet' });
  assert.equal(snapshot.snapshotId, 'snapshot-1');
  assert.equal(snapshot.balanceBaseUnits, '2100000000000000');
  assert.equal(snapshot.network, 'mainnet');
  assert.equal(insertedValues[0], 'wallet-row-1');
  assert.equal(insertedValues[1], 'mainnet');
  assert.equal(insertedValues[5], '2100000000000000');
  assert.equal(insertedValues[6], 123456);
  assert.match(insertedValues[8], /^[a-f0-9]{64}$/);
});

test('wallet snapshot service rejects missing verified wallet and unknown network', async () => {
  const pool = {
    async query() { return { rowCount: 0, rows: [] }; },
    async connect() { throw new Error('must not connect'); }
  };
  const service = createWalletSnapshotService({
    pool,
    jettonMasterAddress: master,
    providerFactory() { throw new Error('must not create provider'); }
  });
  await assert.rejects(service.capture({ userId: 'user-1', network: 'mainnet' }),
    (error) => error.code === 'VERIFIED_WALLET_NOT_FOUND');
  await assert.rejects(service.capture({ userId: 'user-1', network: 'devnet' }),
    (error) => error.code === 'INVALID_NETWORK');
});

test('TON RPC provider rejects unsupported networks and non-HTTPS endpoints', () => {
  assert.throws(() => createTonRpcProvider({
    network: 'devnet', jettonMasterAddress: master, endpoint: 'https://rpc.example'
  }), (error) => error instanceof TonRpcError && error.code === 'INVALID_NETWORK');
  assert.throws(() => createTonRpcProvider({
    network: 'mainnet', jettonMasterAddress: master, endpoint: 'http://rpc.example'
  }), (error) => error instanceof TonRpcError && error.code === 'TON_RPC_NOT_CONFIGURED');
  assert.equal(Address.parse(owner).toRawString(), owner);
});
