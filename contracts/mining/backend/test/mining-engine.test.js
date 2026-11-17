'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MiningError,
  parseRate,
  calculateReward
} = require('../../engine.gs');

test('parseRate converts decimal base-unit rates to fixed precision', () => {
  assert.equal(parseRate('1').toString(), '1000000000000');
  assert.equal(parseRate('0.5').toString(), '500000000000');
  assert.equal(parseRate('1.000000000001').toString(), '1000000000001');
});

test('parseRate rejects zero, negative, exponent and excessive precision', () => {
  for (const value of ['0', '-1', '1e3', '0.0000000000001', '']) {
    assert.throws(() => parseRate(value), MiningError);
  }
});

test('calculateReward returns integer base units without floating point', () => {
  assert.equal(calculateReward('2', 1000).toString(), '2');
  assert.equal(calculateReward('0.5', 2000).toString(), '1');
  assert.equal(calculateReward('1.25', 4000).toString(), '5');
});

test('calculateReward rejects negative elapsed time and invalid rate', () => {
  assert.throws(() => calculateReward('1', -1), MiningError);
  assert.throws(() => calculateReward('0', 1000), MiningError);
});
