import 'server-only';

import { query } from './db';
import type { Line } from './money';
import { newToken } from './tokens';
import { type Invoice, type InvoiceStatus, toIsoDate } from './types';

export type { Invoice, InvoiceStatus } from './types';
export { invoiceTotals, isOverdue } from './types';

type Row = Record<string, unknown>;

function toInvoice(row: Row, lines: Line[]): Invoice {
  return {
    id: String(row.id),
    publicToken: row.public_token as string,
    manageToken: row.manage_token as string,
    number: row.number as string,
    status: row.status as InvoiceStatus,
    issuerName: row.issuer_name as string,
    issuerEmail: (row.issuer_email as string) ?? null,
    issuerDetails: (row.issuer_details as string) ?? null,
    clientName: row.client_name as string,
    clientEmail: (row.client_email as string) ?? null,
    clientDetails: (row.client_details as string) ?? null,
    currency: row.currency as string,
    taxRateBp: Number(row.tax_rate_bp),
    issuedOn: isoDate(row.issued_on),
    dueOn: row.due_on ? isoDate(row.due_on) : null,
    notes: (row.notes as string) ?? null,
    paidAt: row.paid_at ? new Date(row.paid_at as string).toISOString() : null,
    lines,
  };
}

/** Postgres DATE comes back as a Date in the server's zone; keep only the day. */
function isoDate(value: unknown): string {
  return toIsoDate(value instanceof Date ? value : new Date(String(value)));
}

export type NewInvoice = {
  number: string;
  issuerName: string;
  issuerEmail?: string;
  issuerDetails?: string;
  clientName: string;
  clientEmail?: string;
  clientDetails?: string;
  currency: string;
  taxRateBp: number;
  issuedOn: string;
  dueOn?: string | null;
  notes?: string;
  lines: Line[];
};

export async function createInvoice(input: NewInvoice): Promise<Invoice> {
  const client = await (await import('./db')).pool.connect();

  try {
    // One transaction: an invoice with no lines is not a partial success, it
    // is a bug that would go out to a client showing a total of zero.
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO invoices (
         public_token, manage_token, number, issuer_name, issuer_email, issuer_details,
         client_name, client_email, client_details, currency, tax_rate_bp,
         issued_on, due_on, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        newToken(),
        newToken(),
        input.number,
        input.issuerName,
        input.issuerEmail || null,
        input.issuerDetails || null,
        input.clientName,
        input.clientEmail || null,
        input.clientDetails || null,
        input.currency,
        input.taxRateBp,
        input.issuedOn,
        input.dueOn || null,
        input.notes || null,
      ],
    );

    const invoice = rows[0] as Row;

    for (const [index, line] of input.lines.entries()) {
      await client.query(
        `INSERT INTO line_items (invoice_id, position, description, quantity_milli, unit_price_minor)
         VALUES ($1,$2,$3,$4,$5)`,
        [invoice.id, index, line.description, line.quantityMilli, line.unitPriceMinor],
      );
    }

    await client.query('COMMIT');
    return toInvoice(invoice, input.lines);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function findBy(column: 'public_token' | 'manage_token', token: string) {
  const rows = await query<Row>(`SELECT * FROM invoices WHERE ${column} = $1`, [token]);
  if (rows.length === 0) return null;

  const lines = await query<Row>(
    `SELECT description, quantity_milli, unit_price_minor
       FROM line_items WHERE invoice_id = $1 ORDER BY position`,
    [rows[0].id],
  );

  return toInvoice(
    rows[0],
    lines.map((line) => ({
      description: line.description as string,
      quantityMilli: Number(line.quantity_milli),
      unitPriceMinor: Number(line.unit_price_minor),
    })),
  );
}

export const findByPublicToken = (token: string) => findBy('public_token', token);
export const findByManageToken = (token: string) => findBy('manage_token', token);

export async function setStatus(manageToken: string, status: InvoiceStatus) {
  await query(
    `UPDATE invoices
        SET status = $2,
            paid_at = CASE WHEN $2 = 'paid' THEN now() ELSE NULL END,
            updated_at = now()
      WHERE manage_token = $1`,
    [manageToken, status],
  );
}

