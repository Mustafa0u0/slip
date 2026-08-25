import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { InvoiceDocument } from '@/components/invoice-document';
import { CopyField } from '@/components/copy-field';
import { findByManageToken, setStatus } from '@/lib/invoice';
import type { InvoiceStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Manage invoice — Slip', robots: { index: false } };

export default async function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await findByManageToken(token);
  if (!invoice) notFound();

  async function move(formData: FormData) {
    'use server';
    const next = String(formData.get('status')) as InvoiceStatus;
    if (!['draft', 'sent', 'paid'].includes(next)) return;

    await setStatus(token, next);
    revalidatePath(`/i/${token}/manage`);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <section className="border-rule bg-card no-print mb-10 rounded-xl border p-6">
        <h1 className="font-medium">Your two links</h1>
        <p className="text-muted mt-1 text-sm">
          Send the first to your client. Keep the second — it is the only way back
          to this page, and it cannot be recovered.
        </p>

        <div className="mt-5 space-y-4">
          <CopyField label="Send to your client" path={`/i/${invoice.publicToken}`} />
          <CopyField label="Keep for yourself" path={`/i/${invoice.manageToken}/manage`} />
        </div>

        <form action={move} className="border-rule mt-6 flex flex-wrap items-center gap-2 border-t pt-5">
          <span className="text-muted mr-2 text-sm">Mark as</span>
          {(['draft', 'sent', 'paid'] as const).map((status) => (
            <button
              key={status}
              name="status"
              value={status}
              disabled={invoice.status === status}
              className={`btn ${invoice.status === status ? 'btn-primary' : 'btn-quiet'} px-4 text-sm capitalize disabled:opacity-100`}
            >
              {status}
            </button>
          ))}
        </form>
      </section>

      <InvoiceDocument invoice={invoice} />
    </main>
  );
}
