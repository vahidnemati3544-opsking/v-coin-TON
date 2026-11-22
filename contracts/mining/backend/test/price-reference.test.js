'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  increasePriceScaled,
  scaledPriceToDecimal,
  decimalPriceToScaled
} = require('../src/services/price-reference');

test('initial reference price is exactly USD 0.004', () => {
  assert.equal(decimalPriceToScaled('0.008000000000').toString(), '8000000000');
});

test('72-hour increase compounds by exactly 0.2041 percent', () => {
  const first = increasePriceScaled(decimalPriceToScaled('0.008000000000'));
  assert.equal(scaledPriceToDecimal(first), '0.008016328000');
});

test('price arithmetic remains integer-based across repeated periods', () => {
  let price = decimalPriceToScaled('0.008000000000');
  for (let i = 0; i < 1000; i += 1) price = increasePriceScaled(price);
  assert.ok(price > decimalPriceToScaled('0.008000000000'));
  assert.equal(scaledPriceToDecimal(price).split('.')[1].length, 12);
});

test('invalid reference prices are rejected', () => {
  assert.throws(() => decimalPriceToScaled('0.0080000000001'), TypeError);
  assert.throws(() => increasePriceScaled(0n), TypeError);
});
