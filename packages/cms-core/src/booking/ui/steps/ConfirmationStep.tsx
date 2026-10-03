'use client'

import { useLocale, useTranslations } from 'next-intl'

import { BookingButton } from '../shared/BookingButton'
import { ProgressIndicator } from '../shared/ProgressIndicator'
import { StepShell } from '../shared/StepShell'
import type { BookableService, CustomerInput, ErrorResponse } from '../../api/schemas'
import type { SelectedSlot, VisitType } from '../flow/types'

interface ConfirmationStepProps {
  visitType: VisitType
  service: BookableService
  slot: SelectedSlot
  customer: CustomerInput
  isSubmitting: boolean
  submitError?: ErrorResponse['error'] | undefined
  onConfirm: () => void
  onEditSlot: () => void
  onBack: () => void
}

const ERROR_KEY_BY_CODE: Partial<Record<string, string>> = {
  SLOT_FULL: 'errors.slotFull',
  SLOT_CLOSED: 'errors.slotClosed',
  RATE_LIMITED: 'errors.rateLimited',
  INVALID_INPUT: 'errors.invalidInput',
  // STEP 2 Part 2 item 5 — phone-uniqueness guard. Deliberately NOT in
  // ROUTES_BACK_TO_CALENDAR below: re-picking a time doesn't fix a phone
  // conflict, but the default "back" button already returns to the
  // contact step (previousStep('confirmation') === 'contact'), which is
  // exactly where the patient needs to go to correct it.
  PHONE_ALREADY_REGISTERED: 'errors.phoneAlreadyRegistered',
}
// These two codes mean the previously-picked slot is genuinely gone — retrying
// with the same idempotency key will keep failing, so the recovery path is
// "pick a different time", not "press submit again".
const ROUTES_BACK_TO_CALENDAR = new Set(['SLOT_FULL', 'SLOT_CLOSED'])

/** Step 5: confirmation screen — shows everything before submit. */
export function ConfirmationStep({
  visitType,
  service,
  slot,
  customer,
  isSubmitting,
  submitError,
  onConfirm,
  onEditSlot,
  onBack,
}: ConfirmationStepProps) {
  const t = useTranslations('blocks.booking')
  const locale = useLocale()
  const dateTimeLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(slot.startsAt))

  const errorKey = submitError ? (ERROR_KEY_BY_CODE[submitError.code] ?? 'errors.generic') : null

  return (
    <StepShell
      title={t('confirmation.title')}
      backLabel={t('nav.back')}
      onBack={onBack}
      progress={<ProgressIndicator current={5} total={6} label={t('progress.stepLabel', { n: 5, total: 6 })} />}
    >
      <dl className="flex flex-col gap-3 text-base text-[var(--booking-text)]">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--booking-text-muted)]">{t('confirmation.visitTypeLabel')}</dt>
          <dd>{visitType === 'first' ? t('visitType.first') : t('visitType.returning')}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--booking-text-muted)]">{t('confirmation.serviceLabel')}</dt>
          <dd>{service.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--booking-text-muted)]">{t('confirmation.dateTimeLabel')}</dt>
          <dd>{dateTimeLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--booking-text-muted)]">{t('confirmation.nameLabel')}</dt>
          <dd>
            {customer.family_name} {customer.given_name}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--booking-text-muted)]">{t('confirmation.phoneLabel')}</dt>
          <dd>{customer.phone}</dd>
        </div>
        {customer.email && (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--booking-text-muted)]">{t('confirmation.emailLabel')}</dt>
            <dd>{customer.email}</dd>
          </div>
        )}
      </dl>

      {errorKey && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-2 rounded-md border-l-4 border-[var(--booking-error)] bg-[var(--booking-border)]/20 p-4 text-sm text-[var(--booking-error)]"
        >
          <p>{t(errorKey)}</p>
          {ROUTES_BACK_TO_CALENDAR.has(submitError?.code ?? '') && (
            <button type="button" onClick={onEditSlot} className="self-start font-semibold underline">
              {t('confirmation.editLink')}
            </button>
          )}
        </div>
      )}

      <div className="mt-6">
        <BookingButton type="button" isLoading={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? t('confirmation.submitting') : t('confirmation.submit')}
        </BookingButton>
      </div>
    </StepShell>
  )
}
