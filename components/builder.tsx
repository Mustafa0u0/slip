'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { InvoiceDocument } from '@/components/invoice-document';
import { parseMoneyToMinor, parseQuantityToMilli } from '@/lib/money';
import { type Invoice, toIsoDate } from '@/lib/types';

type DraftLine = { description: string; quantity: string; rate: string };

const BLANK: DraftLine = { description: '', quantity: '1', rate: '' };

/**
 * The builder.
 *
 * The preview is the same `InvoiceDocument` the client will open, rendered
 * from the same state on every keystroke — not a facsimile of it. That is the
 * whole reason the pure types live apart from the database module: a preview
 * that can drift from the real document is worse than no preview, because it
 * is trusted.
 */
export function Builder() {
  const router = useRouter();
  const today = toIsoDate(new Date());

  const [issuerName, setIssuerName] = useState('');
  const [issuerEmail, setIssuerEmail] = useState('');
  const [issuerDetails, setIssuerDetails] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientDetails, setClientDetails] = useState('');
  const [number, setNumber] = useState(`INV-${new Date().getFullYear()}-001`);
  const [currency, setCurrency] = useState('MYR');
  const [taxPercent, setTaxPercent] = useState('0');
  const [issuedOn, setIssuedOn] = useState(today);
  const [dueOn, setDueOn] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ ...BLANK }]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo<Invoice>(
    () => ({
      id: 'preview',
      publicToken: 'preview',
      manageToken: 'preview',
      number: number || 'INV-0001',
      status: 'draft',
      issuerName: issuerName || 'Your name',
      issuerEmail: issuerEmail || null,
      issuerDetails: issuerDetails || null,
      clientName: clientName || 'Client name',
      clientEmail: clientEmail || null,
      clientDetails: clientDetails || null,
      currency,
      taxRateBp: Math.round((Number.parseFloat(taxPercent) || 0) * 100),
      issuedOn,
      dueOn: dueOn || null,
      notes: notes || null,
      paidAt: null,
      lines: lines
        .filter((line) => line.description.trim() || line.rate.trim())
        .map((line) => ({
          description: line.description || 'Item',
          quantityMilli: parseQuantityToMilli(line.quantity) || 1000,
          unitPriceMinor: parseMoneyToMinor(line.rate),
        })),
    }),
    [
      number, issuerName, issuerEmail, issuerDetails, clientName, clientEmail,
      clientDetails, currency, taxPercent, issuedOn, dueOn, notes, lines,
    ],
  );

  const usable = preview.lines.length > 0 && issuerName.trim() && clientName.trim();

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          number, issuerName, issuerEmail, issuerDetails,
          clientName, clientEmail, clientDetails,
          currency,
          taxRateBp: preview.taxRateBp,
          issuedOn,
          dueOn: dueOn || null,
          notes,
          lines: preview.lines,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not save the invoice.');

      router.push(`/i/${body.manageToken}/manage`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the invoice.');
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14">
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (usable && !saving) void save();
        }}
      >
        <Section title="You">
          <Text label="Your name" value={issuerName} onChange={setIssuerName} placeholder="Mustafa Yahya" required />
          <Text label="Your email" value={issuerEmail} onChange={setIssuerEmail} type="email" />
          <Area label="Your address or details" value={issuerDetails} onChange={setIssuerDetails} />
        </Section>

        <Section title="Client">
          <Text label="Client name" value={clientName} onChange={setClientName} placeholder="Kopi Lab Sdn Bhd" required />
          <Text label="Client email" value={clientEmail} onChange={setClientEmail} type="email" />
          <Area label="Client address or details" value={clientDetails} onChange={setClientDetails} />
        </Section>

        <Section title="Invoice">
          <div className="grid grid-cols-2 gap-3">
            <Text label="Number" value={number} onChange={setNumber} />
            <Text label="Currency" value={currency} onChange={(v) => setCurrency(v.toUpperCase().slice(0, 3))} />
            <Text label="Issued" value={issuedOn} onChange={setIssuedOn} type="date" />
            <Text label="Due" value={dueOn} onChange={setDueOn} type="date" min={issuedOn} />
          </div>
          <Text label="Tax %" value={taxPercent} onChange={setTaxPercent} inputMode="decimal" />
        </Section>

        <Section title="Items">
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="border-rule rounded-lg border p-3">
                <input
                  className="field"
                  placeholder="What was done"
                  value={line.description}
                  onChange={(e) => update(index, { description: e.target.value })}
                  aria-label={`Item ${index + 1} description`}
                />
                <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    className="field tabular"
                    inputMode="decimal"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => update(index, { quantity: e.target.value })}
                    aria-label={`Item ${index + 1} quantity`}
                  />
                  <input
                    className="field tabular"
                    inputMode="decimal"
                    placeholder="Rate"
                    value={line.rate}
                    onChange={(e) => update(index, { rate: e.target.value })}
                    aria-label={`Item ${index + 1} rate`}
                  />
                  <button
                    type="button"
                    onClick={() => setLines((all) => all.filter((_, i) => i !== index))}
                    disabled={lines.length === 1}
                    className="text-muted hover:text-ink px-2 disabled:opacity-30"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLines((all) => [...all, { ...BLANK }])}
            className="btn btn-quiet mt-3 w-full"
          >
            Add an item
          </button>
        </Section>

        <Section title="Notes">
          <Area label="Payment terms, bank details, anything else" value={notes} onChange={setNotes} />
        </Section>

        {error ? (
          <p role="alert" className="text-due text-sm">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={!usable || saving} className="btn btn-primary w-full disabled:opacity-50">
          {saving ? 'Saving…' : 'Create invoice'}
        </button>

        {!usable ? (
          <p className="text-muted -mt-4 text-xs">
            Add your name, the client&rsquo;s name, and at least one item.
          </p>
        ) : null}
      </form>

      <div className="lg:sticky lg:top-10 lg:self-start">
        <p className="text-muted mb-3 text-xs tracking-[0.1em] uppercase">
          What your client will see
        </p>
        <div className="origin-top scale-[0.92] sm:scale-100">
          <InvoiceDocument invoice={preview} />
        </div>
      </div>
    </div>
  );

  function update(index: number, patch: Partial<DraftLine>) {
    setLines((all) => all.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-medium">{title}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

// `onChange` and `value` are re-declared with friendlier types, so the native
// ones have to be excluded or the two collide.
type TextProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function Text({ label, value, onChange, ...rest }: TextProps) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}

function Area({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea className="field" rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
