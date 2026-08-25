import Link from 'next/link';

import { Builder } from '@/components/builder';

export const metadata = { title: 'Write an invoice — Slip' };

export default function NewInvoicePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <Link href="/" className="text-muted text-sm hover:underline">
        ← Slip
      </Link>
      <h1 className="mt-4 mb-10 text-2xl font-semibold tracking-tight">Write an invoice</h1>
      <Builder />
    </main>
  );
}
