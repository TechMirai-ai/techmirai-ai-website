type StatusBadgeVariant = 'available' | 'inDevelopment'

interface StatusBadgeProps {
  variant: StatusBadgeVariant
  label: string
  className?: string
}

// Pack-2/E2: reusable status badge (Content Spec §4 "Global buttons and
// labels" — "Available now"/"In development"). No copy logic inside — the
// caller passes the already-localized label (e.g. from
// apps/techmirai-web/src/lib/labels.ts). The Voice edition is always
// `variant="inDevelopment"`, never "available".
const variantClasses: Record<StatusBadgeVariant, string> = {
  available: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  inDevelopment: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
}

const dotClasses: Record<StatusBadgeVariant, string> = {
  available: 'bg-[var(--color-success)]',
  inDevelopment: 'bg-[var(--color-warning)]',
}

export function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={['h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[variant]].join(' ')} />
      {label}
    </span>
  )
}
