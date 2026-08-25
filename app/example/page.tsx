import Link from 'next/link';

import { InvoiceDocument } from '@/components/invoice-document';
import type { Invoice } from '@/lib/types';

/**
 * A worked example, rendered from the same component the real thing uses.
 *
 * Not a screenshot and not a separate template: if the document changes, this
 * changes with it, so the sample can never quietly drift from the product.
 */
const SAMPLE: Invoice = {
  id: 'example',
  publicToken: 'example',
  manageToken: 'example',
  number: 'INV-2026-014',
  status: 'sent',
  issuerName: 'Mustafa Yahya',
  issuerEmail: 'hello@example.com',
  issuerDetails: 'Software engineering\nRemote, worldwide',
  clientName: 'Nadia Rahim',
  clientEmail: 'nadia@example.com',
  clientDetails: 'Kopi Lab Sdn Bhd',
  currency: 'MYR',
  taxRateBp: 600,
  issuedOn: '2026-08-01',
  dueOn: '2026-08-15',
  notes: 'Bank transfer preferred. Reference the invoice number so it can be matched.',
  paidAt: null,
  lines: [
    { description: 'Flutter app — checkout and payments', quantityMilli: 32_000, unitPriceMinor: 18_000 },
    { description: 'API integration and testing', quantityMilli: 12_500, unitPriceMinor: 18_000 },
    { description: 'Play Store release and store listing', quantityMilli: 1_000, unitPriceMinor: 65_000 },
  ],
};

export default function ExamplePage() {
  return (
    <main className="px-4 py-10 sm:py-16">
      <div className="no-print mx-auto mb-8 flex max-w-3xl items-center justify-between">
        <Link href="/" className="text-muted text-sm hover:underline">
          ← Slip
        </Link>
        <Link href="/new" className="btn btn-primary">
          Write your own
        </Link>
      </div>

      <InvoiceDocument invoice={SAMPLE} />
    </main>
  );
}
