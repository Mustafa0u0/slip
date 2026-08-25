import { StatusBadge } from '@/components/status-badge';
import { type Invoice, invoiceTotals, isOverdue } from '@/lib/types';
import { formatMoney, formatQuantity, lineTotalMinor } from '@/lib/money';

/**
 * The invoice itself — the only thing a client ever sees.
 *
 * Deliberately a document rather than a screen: fixed measure, generous
 * margins, and the amount due given the largest type on the page. Everything
 * else here is supporting evidence for that one number.
 */
export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const { subtotalMinor, taxMinor, totalMinor } = invoiceTotals(invoice);
  const overdue = isOverdue(invoice);
  const money = (minor: number) => formatMoney(minor, invoice.currency);

  return (
    <article className="bg-card border-rule print-plain mx-auto max-w-3xl rounded-xl border p-8 sm:p-12">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-muted text-xs tracking-[0.12em] uppercase">Invoice</p>
          <p className="tabular mt-1 text-2xl font-semibold">{invoice.number}</p>
        </div>
        <StatusBadge status={invoice.status} overdue={overdue} />
      </header>

      <div className="border-rule mt-10 grid gap-8 border-t pt-8 sm:grid-cols-2">
        <Party label="From" name={invoice.issuerName} email={invoice.issuerEmail} details={invoice.issuerDetails} />
        <Party label="To" name={invoice.clientName} email={invoice.clientEmail} details={invoice.clientDetails} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8 sm:max-w-sm">
        <Fact label="Issued" value={invoice.issuedOn} />
        {invoice.dueOn ? (
          <Fact label="Due" value={invoice.dueOn} emphasis={overdue} />
        ) : null}
      </div>

      <table className="mt-10 w-full text-sm">
        <thead>
          <tr className="border-rule text-muted border-b text-xs tracking-[0.08em] uppercase">
            <th className="py-2 text-left font-medium">Description</th>
            <th className="w-20 py-2 text-right font-medium">Qty</th>
            <th className="w-28 py-2 text-right font-medium">Rate</th>
            <th className="w-32 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, index) => (
            <tr key={index} className="border-faint border-b align-top">
              <td className="py-3 pr-4">{line.description}</td>
              <td className="tabular py-3 text-right">{formatQuantity(line.quantityMilli)}</td>
              <td className="tabular py-3 text-right">{money(line.unitPriceMinor)}</td>
              <td className="tabular py-3 text-right">{money(lineTotalMinor(line))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <Row label="Subtotal" value={money(subtotalMinor)} />
          {invoice.taxRateBp > 0 ? (
            <Row label={`Tax (${invoice.taxRateBp / 100}%)`} value={money(taxMinor)} />
          ) : null}
          <div className="border-rule mt-3 flex items-baseline justify-between border-t pt-3">
            <dt className="text-muted text-xs tracking-[0.1em] uppercase">
              {invoice.status === 'paid' ? 'Paid' : 'Amount due'}
            </dt>
            <dd className="tabular text-2xl font-semibold">{money(totalMinor)}</dd>
          </div>
        </dl>
      </div>

      {invoice.notes ? (
        <div className="border-rule mt-10 border-t pt-6">
          <p className="text-muted text-xs tracking-[0.1em] uppercase">Notes</p>
          <p className="mt-2 text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      ) : null}
    </article>
  );
}

function Party({
  label,
  name,
  email,
  details,
}: {
  label: string;
  name: string;
  email: string | null;
  details: string | null;
}) {
  return (
    <div>
      <p className="text-muted text-xs tracking-[0.1em] uppercase">{label}</p>
      <p className="mt-2 font-medium">{name}</p>
      {email ? <p className="text-muted text-sm">{email}</p> : null}
      {details ? (
        <p className="text-muted mt-1 text-sm whitespace-pre-wrap">{details}</p>
      ) : null}
    </div>
  );
}

function Fact({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <p className="text-muted text-xs tracking-[0.1em] uppercase">{label}</p>
      <p className={`tabular mt-1 text-sm ${emphasis ? 'text-due font-medium' : ''}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
