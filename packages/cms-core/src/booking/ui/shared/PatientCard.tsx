interface PatientCardLabels {
  clinicNameLabel: string
  nameLabel: string
  dateTimeLabel: string
  confirmationCodeLabel: string
}

interface PatientCardProps {
  clinicName: string
  customerName: string
  dateTimeLabel: string
  confirmationCode: string
  labels: PatientCardLabels
}

/**
 * 診察券 (patient card) — the screen customers screenshot. No shadows or
 * gradients per the design constraint: the visual weight comes from the
 * accent header block, a dashed ticket-style divider, and a bordered box
 * around the confirmation code, not from elevation effects.
 */
export function PatientCard({ clinicName, customerName, dateTimeLabel, confirmationCode, labels }: PatientCardProps) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-2 border-[var(--booking-accent)] bg-white">
      <div className="bg-[var(--booking-accent)] px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{labels.clinicNameLabel}</p>
        <p className="mt-1 text-lg font-bold text-white">{clinicName}</p>
      </div>

      <div className="flex flex-col gap-5 px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--booking-text-muted)]">{labels.nameLabel}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--booking-text)]">{customerName}</p>
        </div>

        <div className="border-t border-dashed border-[var(--booking-border)] pt-5">
          <p className="text-xs uppercase tracking-wide text-[var(--booking-text-muted)]">{labels.dateTimeLabel}</p>
          <p className="mt-1 text-base font-medium text-[var(--booking-text)]">{dateTimeLabel}</p>
        </div>

        <div className="rounded-lg border border-[var(--booking-border)] bg-[var(--booking-bg)] px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--booking-text-muted)]">{labels.confirmationCodeLabel}</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.15em] text-[var(--booking-accent)] tabular-nums">
            {confirmationCode}
          </p>
        </div>
      </div>
    </div>
  )
}
