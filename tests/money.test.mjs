/**
 * Money arithmetic, checked with node:test — no framework, no install.
 * Run with: node --test tests/
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lineTotalMinor, roundHalfAway, totals } from '../.test-build/money.js';

test('a line total rounds once, at the line', () => {
  // 1.5 hours at 18.00 = 27.00
  assert.equal(lineTotalMinor({ description: '', quantityMilli: 1500, unitPriceMinor: 1800 }), 2700);
});

test('a fractional quantity that cannot divide evenly still rounds predictably', () => {
  // 0.333 hours at 100.00 = 33.30
  assert.equal(lineTotalMinor({ description: '', quantityMilli: 333, unitPriceMinor: 10_000 }), 3330);
});

test('rounding goes half away from zero, in both directions', () => {
  assert.equal(roundHalfAway(0.5), 1);
  assert.equal(roundHalfAway(-0.5), -1, 'Math.round would give -0, which breaks credit notes');
  assert.equal(roundHalfAway(2.5), 3);
  assert.equal(roundHalfAway(-2.5), -3);
});

test('tax is taken on the subtotal, so the invoice matches a calculator', () => {
  const lines = [
    { description: '', quantityMilli: 1000, unitPriceMinor: 1033 },
    { description: '', quantityMilli: 1000, unitPriceMinor: 1033 },
    { description: '', quantityMilli: 1000, unitPriceMinor: 1033 },
  ];

  const { subtotalMinor, taxMinor, totalMinor } = totals(lines, 600);

  assert.equal(subtotalMinor, 3099);
  // 30.99 * 6% = 1.8594 -> 1.86
  assert.equal(taxMinor, 186);
  assert.equal(totalMinor, 3285);
});

test('no tax means no tax', () => {
  const { taxMinor, totalMinor } = totals(
    [{ description: '', quantityMilli: 1000, unitPriceMinor: 5000 }],
    0,
  );
  assert.equal(taxMinor, 0);
  assert.equal(totalMinor, 5000);
});

test('an empty invoice totals zero rather than NaN', () => {
  assert.deepEqual(totals([], 600), { subtotalMinor: 0, taxMinor: 0, totalMinor: 0 });
});

test('a hundred lines of a third of a cent do not drift', () => {
  // The reason money is not held in floats. Summed as floats, 100 lines of
  // 0.07 gives 7.000000000000001; as integers it is exactly 700.
  const lines = Array.from({ length: 100 }, () => ({
    description: '',
    quantityMilli: 1000,
    unitPriceMinor: 7,
  }));

  assert.equal(totals(lines, 0).subtotalMinor, 700);
});
