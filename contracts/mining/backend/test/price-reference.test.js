'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  INCREASE_RATE_PERCENT,
  increasePriceScaled,
  scaledPriceToDecimal,
  decimalPriceToScaled
} = require('../src/services/price-reference');

test('initial reference price is exactly USD 0.004', () => {
  assert.equal(decimalPriceToScaled('0.004000000000').toString(), '4000000000');
});

test('72-hour increase implements the approved 50 percent annual compound target', () => {
  assert.equal(INCREASE_RATE_PERCENT, '0.33381492');
  const first = increasePriceScaled(decimalPriceToScaled('0.004000000000'));
  assert.equal(scaledPriceToDecimal(first), '0.004013352597');
});

test('price arithmetic remains integer-based across repeated periods', () => {
  let price = decimalPriceToScaled('0.004000000000');
  for (let i = 0; i < 1000; i += 1) price = increasePriceScaled(price);
  assert.ok(price > decimalPriceToScaled('0.004000000000'));
  assert.equal(scaledPriceToDecimal(price).split('.')[1].length, 12);
});

test('invalid reference prices are rejected', () => {
  assert.throws(() => decimalPriceToScaled('0.0040000000001'), TypeError);
  assert.throws(() => increasePriceScaled(0n), TypeError);
});
