'use client'

import { useLocale, useTranslations } from 'next-intl'

import { BookingButton } from './shared/BookingButton'
import type { LineManageAppointment } from '../api/schemas'
import { BOOKING_TIME_ZONE } from '../time-zone'

export interface LineManagePickerProps {
  appointments: LineManageAppointment[]
  onSelect: (appointment: LineManageAppointment) => void
}

/**
 * STEP 2 Part 4 items 2/3 — presentational list of the caller's own
 * upcoming bookings, shown when there's more than one so they can tell
 * them apart and pick the right one before ManageAppointmentView mounts for
 * it. Zero next/navigation dependencies, same portability discipline as
 * BookingFlow/ManageAppointmentView — this is what makes it reusable inside
 * the LIFF manage page unmodified.
 */
export function LineManagePicker({ appointments, onSelect }: LineManagePickerProps) {
  const t = useTranslations('blocks.booking.linePicker')
  const locale = useLocale()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--booking-text-muted)]">{t('prompt')}</p>
      {appointments.map((appointment) => {
        const dateTimeLabel = new Intl.DateTimeFormat(locale, {
          dateStyle: 'long',
          timeStyle: 'short',
          timeZone: BOOKING_TIME_ZONE,
        }).format(new Date(appointment.scheduled_at))

        return (
          <BookingButton
            key={appointment.confirmation_code}
            type="button"
            variant="outline"
            onClick={() => onSelect(appointment)}
            className="flex-col items-start gap-1 text-left"
          >
            <span className="font-semibold">{appointment.service_name}</span>
            <span className="text-sm text-[var(--booking-text-muted)]">{dateTimeLabel}</span>
          </BookingButton>
        )
      })}
    </div>
  )
}
