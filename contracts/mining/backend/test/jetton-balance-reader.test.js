'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { JettonBalanceError, createJettonBalanceReader } = require('../src/services/jetton-balance-reader');

const owner = 'EQ_OWNER';
const master = 'EQ_MASTER';
const jettonWallet = 'EQ_JETTON_WALLET';
const now = Date.parse('2026-11-23T08:00:00.000Z');

function makeReader(overrides = {}) {
  const provider = {
    async getJettonWalletAddress(address, context) {
      assert.equal(address, owner);
      assert.equal(context.network, 'mainnet');
      assert.equal(context.jettonMasterAddress, master);
      return jettonWallet;
    },
    async getJettonWalletData(address, context) {
      assert.equal(address, jettonWallet);
      assert.equal(context.network, 'mainnet');
      return {
        ownerAddress: owner,
        jettonMasterAddress: master,
        balanceBaseUnits: '2100000000000000',
        blockSeqno: 123456,
        observedAt: new Date(now - 1000).toISOString(),
        isFinal: true,
        ...overrides
      };
    }
  };
  return createJettonBalanceReader({
    network: 'mainnet',
    jettonMasterAddress: master,
    provider,
    now: () => now,
    maxSnapshotAgeMs: 120000
  });
}

test('reader returns only a finalized, fresh balance for the derived owner Jetton wallet', async () => {
  const snapshot = await makeReader().read(owner);
  assert.equal(snapshot.balanceBaseUnits, '2100000000000000');
  assert.equal(snapshot.ownerWalletAddress, owner);
  assert.equal(snapshot.jettonMasterAddress, master);
  assert.equal(snapshot.jettonWalletAddress, jettonWallet);
  assert.equal(snapshot.blockSeqno, 123456);
  assert.equal(snapshot.isFinal, true);
});

test('reader rejects a Jetton wallet owned by a different address', async () => {
  await assert.rejects(
    makeReader({ ownerAddress: 'EQ_ATTACKER' }).read(owner),
    (error) => error instanceof JettonBalanceError && error.code === 'JETTON_OWNER_MISMATCH'
  );
});

test('reader rejects a different Jetton master', async () => {
  await assert.rejects(
    makeReader({ jettonMasterAddress: 'EQ_OTHER_MASTER' }).read(owner),
    (error) => error instanceof JettonBalanceError && error.code === 'JETTON_MASTER_MISMATCH'
  );
});

test('reader rejects unfinalized and stale snapshots', async () => {
  await assert.rejects(
    makeReader({ isFinal: false }).read(owner),
    (error) => error.code === 'CHAIN_SNAPSHOT_NOT_FINAL'
  );
  await assert.rejects(
    makeReader({ observedAt: new Date(now - 300000).toISOString() }).read(owner),
    (error) => error.code === 'CHAIN_SNAPSHOT_STALE'
  );
});

test('reader rejects negative, malformed balances and invalid block sequence numbers', async () => {
  await assert.rejects(makeReader({ balanceBaseUnits: '-1' }).read(owner), /cannot be negative/);
  await assert.rejects(makeReader({ balanceBaseUnits: '1.2' }).read(owner), /integer base-unit/);
  await assert.rejects(makeReader({ blockSeqno: -1 }).read(owner), /sequence number/);
});

test('reader requires explicit network and provider configuration', () => {
  assert.throws(() => createJettonBalanceReader({
    network: 'unknown', jettonMasterAddress: master, provider: {}
  }), (error) => error.code === 'INVALID_NETWORK');
  assert.throws(() => createJettonBalanceReader({
    network: 'mainnet', jettonMasterAddress: master, provider: {}
  }), (error) => error.code === 'INVALID_PROVIDER');
});
