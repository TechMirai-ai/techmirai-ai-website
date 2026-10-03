'use client'

import { useLocale, useTranslations } from 'next-intl'

import { CalendarGrid } from './calendar/CalendarGrid'
import type { AvailabilityLabelKey } from './calendar/availability-symbol'
import { getWeekDates } from './calendar/week'
import { useManageAppointment } from './flow/useManageAppointment'
import { BookingButton } from './shared/BookingButton'

export interface ManageAppointmentViewProps {
  clinicName: string
  clinicPhone: string
  cancellationCutoffHours: number
  confirmationCode: string
  accessToken: string
}

const ERROR_KEY_BY_CODE: Partial<Record<string, string>> = {
  SLOT_FULL: 'errors.slotFull',
  SLOT_CLOSED: 'errors.slotClosed',
  RATE_LIMITED: 'errors.rateLimited',
  INVALID_INPUT: 'errors.invalidInput',
  CUTOFF_PASSED: 'errors.cutoffPassed',
}

// Matches the backend's combined cancel/reschedule "still actionable"
// status sets (cancel.ts's NOT_CANCELLABLE_STATUSES, reschedule.ts's
// NOT_RESCHEDULABLE_STATUSES) — buttons must not be offered for an
// appointment the server would reject regardless of the cutoff (e.g.
// already cancelled by staff, completed, or mid-reschedule elsewhere).
const ACTIONABLE_STATUSES = new Set(['booked', 'confirmed', 'checked_in'])

/**
 * Customer self-service cancel/reschedule — reuses WO-3's CalendarGrid and
 * design tokens (wrap this in className="booking-flow" so it inherits
 * tokens.css). Deliberately does NOT reuse PatientCard: /lookup never
 * returns the customer's name by design (minimal disclosure for a
 * code+token-gated, unauthenticated endpoint), so there is no customerName
 * to show here — this renders its own smaller summary instead.
 */
export function ManageAppointmentView({
  clinicName,
  clinicPhone,
  cancellationCutoffHours,
  confirmationCode,
  accessToken,
}: ManageAppointmentViewProps) {
  const t = useTranslations('blocks.booking')
  const locale = useLocale()
  const flow = useManageAppointment(confirmationCode, accessToken)
  const { state } = flow

  if (state.step === 'loading') {
    return <p className="text-[var(--booking-text-muted)]">{t('manage.loading')}</p>
  }

  if (state.step === 'not_found') {
    return <p role="alert">{t('manage.notFound')}</p>
  }

  const appointment = state.appointment
  if (!appointment) return null

  const dateTimeLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(appointment.scheduledAt))

  const isPastCutoff =
    new Date(appointment.scheduledAt).getTime() - Date.now() < cancellationCutoffHours * 60 * 60 * 1000
  const isActionable = ACTIONABLE_STATUSES.has(appointment.status)

  if (state.step === 'reschedule_picking') {
    const weekDates = getWeekDates(flow.weekStart)
    const shortDate = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
    const weekdayLabels = weekDates.map((d) => weekday.format(d))
    const weekRangeLabel = `${shortDate.format(weekDates[0]!)} – ${shortDate.format(weekDates[6]!)}`
    const legendLabels: Record<AvailabilityLabelKey, string> = {
      plenty: t('calendar.legend.plenty'),
      available: t('calendar.legend.available'),
      few: t('calendar.legend.few'),
      full: t('calendar.legend.full'),
      closed: t('calendar.legend.closed'),
    }
    const errorKey = state.actionError ? (ERROR_KEY_BY_CODE[state.actionError.code] ?? 'errors.generic') : null

    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-[var(--booking-accent)]">{t('manage.reschedule.title')}</h2>

        {errorKey && (
          <p
            role="alert"
            className="rounded-md border-l-4 border-[var(--booking-error)] bg-[var(--booking-border)]/20 p-4 text-sm text-[var(--booking-error)]"
          >
            {t(errorKey)}
          </p>
        )}

        {flow.availabilityLoading && !flow.availability ? (
          <p className="text-[var(--booking-text-muted)]">{t('calendar.loading')}</p>
        ) : (
          <CalendarGrid
            weekStart={flow.weekStart}
            availability={flow.availability ?? { dates: [] }}
            selectedSlot={state.newSlot}
            onSelectSlot={flow.selectNewSlot}
            onPrevWeek={flow.goToPrevWeek}
            onNextWeek={flow.goToNextWeek}
            canGoPrevWeek={flow.canGoPrevWeek}
            weekdayLabels={weekdayLabels}
            weekRangeLabel={weekRangeLabel}
            prevWeekLabel={t('calendar.prevWeek')}
            nextWeekLabel={t('calendar.nextWeek')}
            legendLabels={legendLabels}
            getSlotAriaLabel={({ date, time, labelKey }) =>
              t('calendar.selectedSlotLabel', { date, time, symbolLabel: legendLabels[labelKey] })
            }
          />
        )}

        <div className="flex gap-3">
          <BookingButton type="button" variant="outline" onClick={flow.exitReschedule}>
            {t('nav.back')}
          </BookingButton>
          <BookingButton
            type="button"
            disabled={!state.newSlot}
            isLoading={state.actionSubmission === 'submitting'}
            onClick={flow.confirmReschedule}
          >
            {t('manage.reschedule.confirm')}
          </BookingButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      {state.step === 'rescheduled' && (
        <p role="status" className="text-sm font-medium text-[var(--booking-accent)]">
          {state.oldAppointmentCancelled === false ? t('manage.reschedule.successPartial') : t('manage.reschedule.success')}
        </p>
      )}
      {state.step === 'cancelled' && (
        <p role="status" className="text-sm font-medium text-[var(--booking-accent)]">
          {t('manage.cancelledMessage')}
        </p>
      )}

      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-2 border-[var(--booking-accent)] bg-white">
        <div className="bg-[var(--booking-accent)] px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{t('success.clinicNameLabel')}</p>
          <p className="mt-1 text-lg font-bold text-white">{clinicName}</p>
        </div>
        <div className="flex flex-col gap-5 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--booking-text-muted)]">{t('success.dateTimeLabel')}</p>
            <p className="mt-1 text-base font-medium text-[var(--booking-text)]">{dateTimeLabel}</p>
          </div>
          <div className="rounded-lg border border-[var(--booking-border)] bg-[var(--booking-bg)] px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--booking-text-muted)]">{t('success.confirmationCodeLabel')}</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-[0.15em] text-[var(--booking-accent)] tabular-nums">
              {appointment.confirmationCode}
            </p>
          </div>
        </div>
      </div>

      {state.step === 'view' &&
        isActionable &&
        (isPastCutoff ? (
          <p className="max-w-sm text-sm text-[var(--booking-text-muted)]">{t('manage.pastCutoffMessage', { phone: clinicPhone })}</p>
        ) : (
          <div className="flex w-full max-w-sm gap-3">
            <BookingButton type="button" variant="outline" onClick={flow.startReschedule}>
              {t('manage.rescheduleButton')}
            </BookingButton>
            <BookingButton type="button" isLoading={state.actionSubmission === 'submitting'} onClick={flow.cancelAppointment}>
              {t('manage.cancelButton')}
            </BookingButton>
          </div>
        ))}

      {state.actionError && state.step === 'view' && (
        <p role="alert" className="text-sm text-[var(--booking-error)]">
          {t(ERROR_KEY_BY_CODE[state.actionError.code] ?? 'errors.generic')}
        </p>
      )}
    </div>
  )
}
