'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { PatientCard } from '../shared/PatientCard'
import type { ReserveResult } from '../flow/types'
import { BOOKING_TIME_ZONE } from '../../time-zone'

interface SuccessStepProps {
  clinicName: string
  customerName: string
  startsAt: string
  reserveResult: ReserveResult
  onComplete?: ((result: { confirmationCode: string }) => void) | undefined
}

/** Step 6: success screen styled as a 診察券 (patient card) — the screen customers screenshot. */
export function SuccessStep({ clinicName, customerName, startsAt, reserveResult, onComplete }: SuccessStepProps) {
  const t = useTranslations('blocks.booking')
  const locale = useLocale()

  useEffect(() => {
    onComplete?.({ confirmationCode: reserveResult.confirmationCode })
    // Fires once when the success screen mounts — the flow only reaches
    // this step after a real (not optimistic) server response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dateTimeLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(startsAt))

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <h2 className="text-xl font-semibold text-[var(--booking-accent)]">{t('success.title')}</h2>
      <PatientCard
        clinicName={clinicName}
        customerName={customerName}
        dateTimeLabel={dateTimeLabel}
        confirmationCode={reserveResult.confirmationCode}
        labels={{
          clinicNameLabel: t('success.clinicNameLabel'),
          nameLabel: t('confirmation.nameLabel'),
          dateTimeLabel: t('success.dateTimeLabel'),
          confirmationCodeLabel: t('success.confirmationCodeLabel'),
        }}
      />
      <p className="max-w-sm text-sm text-[var(--booking-text-muted)]">{t('success.screenshotHint')}</p>
      <a
        href={`/${locale}/booking/manage?code=${reserveResult.confirmationCode}&token=${reserveResult.linkToken}`}
        className="text-sm font-medium text-[var(--booking-accent)] underline underline-offset-2"
      >
        {t('success.manageLinkLabel')}
      </a>
    </div>
  )
}
