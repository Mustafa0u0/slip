import { type Line, totals } from './money';

/**
 * The invoice shape and the pure functions over it.
 *
 * Separate from lib/invoice.ts, which is `server-only`, because the builder
 * renders the very same document component live as you type. Anything the
 * preview needs has to be importable from the browser.
 */

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export type Invoice = {
  id: string;
  publicToken: string;
  manageToken: string;
  number: string;
  status: InvoiceStatus;
  issuerName: string;
  issuerEmail: string | null;
  issuerDetails: string | null;
  clientName: string;
  clientEmail: string | null;
  clientDetails: string | null;
  currency: string;
  taxRateBp: number;
  issuedOn: string;
  dueOn: string | null;
  notes: string | null;
  paidAt: string | null;
  lines: Line[];
};

export function toIsoDate(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Overdue is derived, never stored.
 *
 * A stored flag needs something to flip it, and whatever that is will be down
 * on the day it matters. A date comparison cannot go stale.
 */
export function isOverdue(invoice: Invoice, today = new Date()): boolean {
  if (invoice.status === 'paid' || !invoice.dueOn) return false;
  return invoice.dueOn < toIsoDate(today);
}

export function invoiceTotals(invoice: Invoice) {
  return totals(invoice.lines, invoice.taxRateBp);
}
