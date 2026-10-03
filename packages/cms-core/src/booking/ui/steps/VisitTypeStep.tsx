'use client'

import { useTranslations } from 'next-intl'

import { ProgressIndicator } from '../shared/ProgressIndicator'
import { StepShell } from '../shared/StepShell'
import type { VisitType } from '../flow/types'

interface VisitTypeStepProps {
  onSelect: (visitType: VisitType) => void
}

/** Step 1: 初診 (first visit) or 再診 (returning). */
export function VisitTypeStep({ onSelect }: VisitTypeStepProps) {
  const t = useTranslations('blocks.booking')

  return (
    <StepShell
      title={t('visitType.title')}
      progress={<ProgressIndicator current={1} total={6} label={t('progress.stepLabel', { n: 1, total: 6 })} />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(['first', 'return'] as const).map((visitType) => (
          <button
            key={visitType}
            type="button"
            onClick={() => onSelect(visitType)}
            className="min-h-[48px] rounded-md border border-[var(--booking-border)] bg-transparent px-4 py-3 text-base font-medium text-[var(--booking-text)] transition-colors duration-[var(--booking-transition-duration)] ease-out hover:bg-[var(--booking-border)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2"
          >
            {visitType === 'first' ? t('visitType.first') : t('visitType.returning')}
          </button>
        ))}
      </div>
    </StepShell>
  )
}
