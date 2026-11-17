'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MiningError,
  parseRate,
  calculateReward,
  createMiningEngine
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


test('confirmReward posts through the atomic database function', async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql: String(sql).trim(), params });
      if (String(sql).trim() === 'BEGIN' || String(sql).trim() === 'COMMIT') {
        return { rowCount: null, rows: [] };
      }
      if (String(sql).includes('post_mining_reward')) {
        return {
          rowCount: 1,
          rows: [{
            result_status: 'posted',
            result_reward_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            result_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            result_amount_base_units: '1250000',
            result_ledger_transaction_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            result_available_reserve_base_units: '4999999998750000'
          }]
        };
      }
      throw new Error('Unexpected SQL in confirmReward test');
    },
    release() {}
  };
  const engine = createMiningEngine({
    pool: { async connect() { return client; } },
    getMiningRate: async () => '1'
  });

  const result = await engine.confirmReward({
    rewardId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    operationKey: 'confirm:reward-001'
  });

  assert.equal(result.status, 'confirmed');
  assert.equal(result.amountBaseUnits, '1250000');
  assert.equal(result.availableReserveBaseUnits, '4999999998750000');
  assert.ok(calls.some((call) => call.sql.includes('post_mining_reward')));
});

test('confirmReward rejects invalid identifiers before opening a transaction', async () => {
  let connected = false;
  const engine = createMiningEngine({
    pool: { async connect() { connected = true; throw new Error('should not connect'); } },
    getMiningRate: async () => '1'
  });

  await assert.rejects(
    () => engine.confirmReward({ rewardId: 'not-a-uuid', operationKey: 'confirm:reward-001' }),
    (error) => error instanceof MiningError && error.code === 'INVALID_REWARD_ID'
  );
  assert.equal(connected, false);
});
