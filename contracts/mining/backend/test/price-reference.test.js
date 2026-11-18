'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  increasePriceScaled,
  scaledPriceToDecimal,
  decimalPriceToScaled
} = require('../src/services/price-reference');

test('initial reference price is exactly USD 0.004', () => {
  assert.equal(decimalPriceToScaled('0.004000000000').toString(), '4000000000');
});

test('each 72-hour period adds exactly 1% of the initial USD 0.004 value', () => {
  const first = increasePriceScaled(decimalPriceToScaled('0.004000000000'));
  assert.equal(scaledPriceToDecimal(first), '0.004040000000');
  const second = increasePriceScaled(first);
  assert.equal(scaledPriceToDecimal(second), '0.004080000000');
});

test('linear price arithmetic remains integer-based across repeated periods', () => {
  let price = decimalPriceToScaled('0.004000000000');
  for (let i = 0; i < 1000; i += 1) price = increasePriceScaled(price);
  assert.equal(scaledPriceToDecimal(price), '0.044000000000');
  assert.equal(scaledPriceToDecimal(price).split('.')[1].length, 12);
});

test('invalid reference prices are rejected', () => {
  assert.throws(() => decimalPriceToScaled('0.0040000000001'), TypeError);
  assert.throws(() => increasePriceScaled(0n), TypeError);
});
