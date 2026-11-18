'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MiningError,
  parseRate,
  calculateReward,
  calculateBalanceReward,
  createMiningEngine
} = require('../../engine.js');

test('parseRate converts decimal rates to 12-place integers', () => {
  assert.equal(parseRate('1').toString(), '1000000000000');
  assert.equal(parseRate('0.25').toString(), '250000000000');
  assert.equal(parseRate('0.000000000001').toString(), '1');
});

test('parseRate rejects malformed rates', () => {
  assert.throws(() => parseRate('-1'), MiningError);
  assert.throws(() => parseRate('1.1234567890123'), MiningError);
  assert.throws(() => parseRate('1e3'), MiningError);
});

test('calculateReward uses integer arithmetic without floating point', () => {
  assert.equal(calculateReward('1', 1000).toString(), '1');
  assert.equal(calculateReward('0.5', 2000).toString(), '1');
  assert.equal(calculateReward('1', 500).toString(), '0');
});

test('calculateReward rejects negative elapsed time', () => {
  assert.throws(() => calculateReward('1', -1), MiningError);
});

test('engine requires a PostgreSQL pool', () => {
  assert.throws(() => createMiningEngine({ pool: null }), MiningError);
});

test('engine rejects invalid claim interval', () => {
  assert.throws(
    () => createMiningEngine({ pool: { connect() {} }, maxClaimIntervalMs: 0 }),
    MiningError
  );
});

test('balance-based mining pays one percent per 24 hours', () => {
  const balance = 25000n * 1000000n;
  assert.equal(calculateBalanceReward(balance, 86400000).toString(), (250n * 1000000n).toString());
  assert.equal(calculateBalanceReward(balance, 3600000).toString(), (balance / 2400n).toString());
  assert.equal(calculateBalanceReward(37500n * 1000000n, 86400000).toString(), (375n * 1000000n).toString());
});

test('balance-based mining rejects negative inputs', () => {
  assert.throws(() => calculateBalanceReward(-1n, 1000), MiningError);
  assert.throws(() => calculateBalanceReward(1000n, -1), MiningError);
});
