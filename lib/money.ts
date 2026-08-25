/**
 * Money is held in minor units — sen, cents — as integers, everywhere.
 *
 * A float cannot represent 0.1 exactly, so a total assembled from floating
 * point line items drifts. On one invoice the drift is invisible; across a
 * year of them it is the discrepancy an accountant finds and nobody can
 * explain. Integers cannot drift, so the only place rounding happens is where
 * this module puts it, deliberately and once.
 */

/** Quantities are thousandths: 1.5 hours is 1500. */
export const QUANTITY_SCALE = 1000;

/** Tax rates are basis points: 6% is 600. */
export const RATE_SCALE = 10_000;

export type Line = {
  description: string;
  quantityMilli: number;
  unitPriceMinor: number;
};

/**
 * Rounds half away from zero, which is what an invoice is expected to do.
 *
 * `Math.round` rounds half *up*, so it treats -0.5 and 0.5 differently. Credit
 * notes carry negative amounts, and a total that rounds one way for a charge
 * and the other for a refund is a bug that only shows up on the refund.
 */
export function roundHalfAway(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Line total, rounded once, at the line. */
export function lineTotalMinor(line: Line): number {
  return roundHalfAway((line.quantityMilli * line.unitPriceMinor) / QUANTITY_SCALE);
}

export type Totals = {
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
};

/**
 * Totals for an invoice.
 *
 * Tax is calculated on the rounded subtotal rather than per line and summed.
 * Both are defensible and they disagree by a unit or two; this one is chosen
 * because it matches the figure a client gets when they check the invoice with
 * a calculator, and an invoice that fails that check costs a phone call.
 */
export function totals(lines: Line[], taxRateBp: number): Totals {
  const subtotalMinor = lines.reduce((sum, line) => sum + lineTotalMinor(line), 0);
  const taxMinor = roundHalfAway((subtotalMinor * taxRateBp) / RATE_SCALE);

  return { subtotalMinor, taxMinor, totalMinor: subtotalMinor + taxMinor };
}

/** For display. Falls back to a plain format if the runtime lacks the locale. */
export function formatMoney(minor: number, currency: string, locale = 'en-MY'): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
}

export function formatQuantity(milli: number): string {
  const value = milli / QUANTITY_SCALE;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '');
}

export function parseMoneyToMinor(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  if (!cleaned) return 0;
  return roundHalfAway(Number.parseFloat(cleaned) * 100);
}

export function parseQuantityToMilli(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  return roundHalfAway(Number.parseFloat(cleaned) * QUANTITY_SCALE);
}
