import { NextResponse } from 'next/server';

import { createInvoice } from '@/lib/invoice';

export const runtime = 'nodejs';

type Body = {
  number?: string;
  issuerName?: string;
  clientName?: string;
  currency?: string;
  taxRateBp?: number;
  issuedOn?: string;
  dueOn?: string | null;
  lines?: { description?: string; quantityMilli?: number; unitPriceMinor?: number }[];
  [key: string]: unknown;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validation lives here, not only in the form.
 *
 * The browser check is a courtesy to the person typing; this one is the actual
 * guarantee, because the endpoint is reachable without ever loading the form.
 */
function problem(body: Body): string | null {
  if (!body.issuerName?.trim()) return 'Your name is required.';
  if (!body.clientName?.trim()) return "The client's name is required.";
  if (!body.number?.trim()) return 'An invoice number is required.';

  if (!DATE.test(body.issuedOn ?? '')) return 'The issue date is not a valid date.';
  if (body.dueOn && !DATE.test(body.dueOn)) return 'The due date is not a valid date.';
  if (body.dueOn && body.dueOn < body.issuedOn!) {
    return 'The due date cannot fall before the issue date.';
  }

  if (!/^[A-Z]{3}$/.test(body.currency ?? '')) {
    return 'The currency should be a three-letter code, such as MYR.';
  }

  const tax = body.taxRateBp ?? 0;
  if (!Number.isInteger(tax) || tax < 0 || tax > 10_000) {
    return 'The tax rate must be between 0% and 100%.';
  }

  const lines = body.lines ?? [];
  if (lines.length === 0) return 'An invoice needs at least one item.';
  if (lines.length > 200) return 'That is more items than an invoice should carry.';

  for (const [index, line] of lines.entries()) {
    const at = `Item ${index + 1}`;
    if (!line.description?.trim()) return `${at} needs a description.`;
    if (!Number.isInteger(line.quantityMilli) || (line.quantityMilli ?? 0) <= 0) {
      return `${at} needs a quantity above zero.`;
    }
    if (!Number.isInteger(line.unitPriceMinor) || (line.unitPriceMinor ?? -1) < 0) {
      return `${at} needs a rate of zero or more.`;
    }
  }

  return null;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Expected JSON.' }, { status: 400 });
  }

  const wrong = problem(body);
  if (wrong) return NextResponse.json({ error: wrong }, { status: 400 });

  try {
    const invoice = await createInvoice({
      number: body.number!.trim(),
      issuerName: body.issuerName!.trim(),
      issuerEmail: String(body.issuerEmail ?? '').trim(),
      issuerDetails: String(body.issuerDetails ?? '').trim(),
      clientName: body.clientName!.trim(),
      clientEmail: String(body.clientEmail ?? '').trim(),
      clientDetails: String(body.clientDetails ?? '').trim(),
      currency: body.currency!,
      taxRateBp: body.taxRateBp ?? 0,
      issuedOn: body.issuedOn!,
      dueOn: body.dueOn ?? null,
      notes: String(body.notes ?? '').trim(),
      lines: body.lines!.map((line) => ({
        description: line.description!.trim(),
        quantityMilli: line.quantityMilli!,
        unitPriceMinor: line.unitPriceMinor!,
      })),
    });

    return NextResponse.json(
      { publicToken: invoice.publicToken, manageToken: invoice.manageToken },
      { status: 201 },
    );
  } catch (error) {
    console.error('Could not create the invoice:', error);
    return NextResponse.json(
      { error: 'Could not save the invoice. Is the database running?' },
      { status: 500 },
    );
  }
}
