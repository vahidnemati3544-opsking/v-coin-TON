'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  WalletMiningError,
  calculateWalletReward,
  createWalletBalanceMiningEngine
} = require('../../wallet-balance-engine');

const NOW = Date.parse('2026-11-18T10:00:00.000Z');
const MASTER = 'EQVCOIN_APPROVED_MASTER_ADDRESS';
const OWNER = 'UQVERIFIED_USER_WALLET_ADDRESS';

function snapshot(overrides = {}) {
  return {
    snapshotId: 'snapshot-0001',
    verified: true,
    finalized: true,
    network: 'testnet',
    jettonMasterAddress: MASTER,
    ownerAddress: OWNER,
    decimals: 6,
    balanceBaseUnits: '53750000000',
    fetchedAt: new Date(NOW).toISOString(),
    sourceProvider: 'test-fixture-provider',
    sourceBlockSeqno: 123456,
    ...overrides
  };
}

test('daily reward is exactly one percent of verified VCOIN balance', () => {
  assert.equal(calculateWalletReward(53750000000n, 86400000).toString(), '537500000');
  assert.equal(calculateWalletReward(58750000000n, 86400000).toString(), '587500000');
  assert.equal(calculateWalletReward(65000000000n, 86400000).toString(), '650000000');
  assert.equal(calculateWalletReward(78750000000n, 86400000).toString(), '787500000');
  assert.equal(calculateWalletReward(105000000000n, 86400000).toString(), '1050000000');
});

test('USD-value examples at USD 0.004 per VCOIN match the approved five examples', () => {
  const examples = [
    ['215', '53750000000', '537500000'],
    ['235', '58750000000', '587500000'],
    ['260', '65000000000', '650000000'],
    ['315', '78750000000', '787500000'],
    ['420', '105000000000', '1050000000']
  ];
  for (const [usd, balance, expectedReward] of examples) {
    const accountValue = Number(usd);
    const vcoinPrice = 0.004;
    assert.equal(Number(balance) / 1e6 * vcoinPrice, accountValue);
    assert.equal(calculateWalletReward(balance, 86400000).toString(), expectedReward);
  }
});

test('partial-day accrual is proportional and uses integer rounding down', () => {
  assert.equal(calculateWalletReward(100000000n, 43200000).toString(), '500000');
  assert.equal(calculateWalletReward(100000000n, 21600000).toString(), '250000');
});

test('wallet engine returns a quote only from a fresh verified finalized snapshot', async () => {
  const engine = createWalletBalanceMiningEngine({
    readVerifiedWalletSnapshot: async () => snapshot(),
    network: 'testnet',
    jettonMasterAddress: MASTER,
    now: () => NOW
  });
  const quote = await engine.quoteDailyReward({ userId: 'user-123' });
  assert.equal(quote.balanceBaseUnits, '53750000000');
  assert.equal(quote.dailyRewardBaseUnits, '537500000');
  assert.equal(quote.rewardRate, '0.01');
  assert.equal(quote.decimals, 6);
});

test('wallet engine fails closed for unverified or unfinalized data', async () => {
  for (const changes of [{ verified: false }, { finalized: false }]) {
    const engine = createWalletBalanceMiningEngine({
      readVerifiedWalletSnapshot: async () => snapshot(changes),
      network: 'testnet',
      jettonMasterAddress: MASTER,
      now: () => NOW
    });
    await assert.rejects(engine.quoteDailyReward({ userId: 'user-123' }), WalletMiningError);
  }
});

test('wallet engine fails closed for wrong network, Jetton master, decimals and stale data', async () => {
  const cases = [
    { network: 'mainnet' },
    { jettonMasterAddress: 'EQOTHER_JETTON_MASTER_ADDRESS' },
    { decimals: 9 },
    { fetchedAt: new Date(NOW - 60001).toISOString() }
  ];
  for (const changes of cases) {
    const engine = createWalletBalanceMiningEngine({
      readVerifiedWalletSnapshot: async () => snapshot(changes),
      network: 'testnet',
      jettonMasterAddress: MASTER,
      maxSnapshotAgeMs: 60000,
      now: () => NOW
    });
    await assert.rejects(engine.quoteDailyReward({ userId: 'user-123' }), WalletMiningError);
  }
});

test('wallet engine requires explicit network, Jetton master and trusted reader', () => {
  assert.throws(() => createWalletBalanceMiningEngine({
    readVerifiedWalletSnapshot: null,
    network: 'testnet',
    jettonMasterAddress: MASTER
  }), WalletMiningError);
  assert.throws(() => createWalletBalanceMiningEngine({
    readVerifiedWalletSnapshot: async () => snapshot(),
    network: 'testnet',
    jettonMasterAddress: ''
  }), WalletMiningError);
  assert.throws(() => createWalletBalanceMiningEngine({
    readVerifiedWalletSnapshot: async () => snapshot(),
    network: 'unknown',
    jettonMasterAddress: MASTER
  }), WalletMiningError);
});
