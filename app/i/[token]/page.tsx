import { notFound } from 'next/navigation';

import { InvoiceDocument } from '@/components/invoice-document';
import { findByPublicToken } from '@/lib/invoice';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const invoice = await findByPublicToken((await params).token);
  return {
    title: invoice ? `Invoice ${invoice.number} from ${invoice.issuerName}` : 'Invoice',
    // An invoice is a private document that happens to be on a public URL.
    // Keeping it out of an index is the least that owes the person it names.
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const invoice = await findByPublicToken((await params).token);
  if (!invoice) notFound();

  return (
    <main className="px-4 py-10 sm:py-16">
      <InvoiceDocument invoice={invoice} />

      <p className="text-muted no-print mx-auto mt-6 max-w-3xl text-center text-sm">
        Press Ctrl-P to save this as a PDF.
      </p>
    </main>
  );
}
