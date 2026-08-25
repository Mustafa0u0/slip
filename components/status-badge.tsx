import type { InvoiceStatus } from '@/lib/types';

/**
 * Status is shown as a word, not a colour alone — roughly one man in twelve
 * cannot reliably separate the green from the amber, and "is this paid?" is
 * the entire question this page exists to answer.
 */
export function StatusBadge({
  status,
  overdue,
}: {
  status: InvoiceStatus;
  overdue?: boolean;
}) {
  const [label, className] = overdue
    ? ['Overdue', 'bg-due-wash text-due']
    : status === 'paid'
      ? ['Paid', 'bg-paid-wash text-paid']
      : status === 'sent'
        ? ['Awaiting payment', 'bg-accent-wash text-accent']
        : ['Draft', 'bg-faint text-muted'];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
