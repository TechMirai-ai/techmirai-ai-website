'use client'

import { useTranslations } from 'next-intl'

import { ProgressIndicator } from '../shared/ProgressIndicator'
import { StepShell } from '../shared/StepShell'
import type { BookableService } from '../../api/schemas'
import type { VisitType } from '../flow/types'

interface ServiceStepProps {
  services: BookableService[]
  isLoading: boolean
  hasError: boolean
  visitType: VisitType
  onSelect: (service: BookableService) => void
  onBack: () => void
}

/** Step 2: service selection — first-visit patients only see services with first_visit_allowed. */
export function ServiceStep({ services, isLoading, hasError, visitType, onSelect, onBack }: ServiceStepProps) {
  const t = useTranslations('blocks.booking')
  const eligible = visitType === 'first' ? services.filter((s) => s.first_visit_allowed) : services

  return (
    <StepShell
      title={t('service.title')}
      backLabel={t('nav.back')}
      onBack={onBack}
      progress={<ProgressIndicator current={2} total={6} label={t('progress.stepLabel', { n: 2, total: 6 })} />}
    >
      {isLoading && <p className="text-[var(--booking-text-muted)]">{t('service.loading')}</p>}
      {hasError && (
        <p role="alert" className="text-[var(--booking-error)]">
          {t('errors.generic')}
        </p>
      )}
      {!isLoading && !hasError && eligible.length === 0 && (
        <p className="text-[var(--booking-text-muted)]">{t('visitType.firstVisitUnavailable')}</p>
      )}
      <ul className="flex flex-col gap-3">
        {eligible.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              onClick={() => onSelect(service)}
              className="flex min-h-[48px] w-full flex-col items-start gap-1 rounded-md border border-[var(--booking-border)] px-4 py-3 text-left transition-colors duration-[var(--booking-transition-duration)] ease-out hover:bg-[var(--booking-border)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2"
            >
              <span className="text-base font-medium text-[var(--booking-text)]">{service.name}</span>
              <span className="text-sm text-[var(--booking-text-muted)]">
                {t('service.durationMinutes', { minutes: service.duration_min })}
                {' · '}
                {service.price_yen !== null ? t('service.priceLabel', { price: service.price_yen }) : t('service.noPrice')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </StepShell>
  )
}
