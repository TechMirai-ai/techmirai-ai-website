interface ProgressIndicatorProps {
  current: number
  total: number
  /** Fully-formatted, translated label (e.g. "Step 2 of 6") — this component has no i18n dependency of its own. */
  label: string
}

export function ProgressIndicator({ current, total, label }: ProgressIndicatorProps) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <p className="mb-2 text-sm text-[var(--booking-text-muted)]">{label}</p>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--booking-border)]"
      >
        <div
          className="h-full bg-[var(--booking-accent)] transition-[width] duration-[var(--booking-transition-duration)] ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
