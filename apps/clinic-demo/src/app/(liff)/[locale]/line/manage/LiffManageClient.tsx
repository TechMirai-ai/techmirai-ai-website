'use client'

import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { useTranslations } from 'next-intl'
import { LineManagePicker, ManageAppointmentView } from '@techmirai/cms-core/booking/ui'
import { lookupLineAppointments } from '@techmirai/cms-core/booking/client'
import type { LineManageAppointment } from '@techmirai/cms-core/booking/api'

interface LiffManageClientProps {
  locale: string
  clinicName: string
  clinicPhone: string
  cancellationCutoffHours: number
}

type Status =
  | { kind: 'initializing' }
  | { kind: 'error' }
  // item 1: no customer record is linked to this LINE identity at all —
  // told plainly, no phone-number-entry fallback (would reopen the
  // identity-verification problem Part 2 already solved).
  | { kind: 'notLinked' }
  | { kind: 'noBookings' }
  // item 3: more than one upcoming booking — let them pick.
  | { kind: 'picking'; appointments: LineManageAppointment[] }
  | { kind: 'managing'; appointment: LineManageAppointment }

/**
 * LIFF manage page shell — STEP 2 Part 4 item 2. Calls liff.init(), waits
 * for it to resolve, verifies identity via the ID token (never a
 * client-asserted lineUserId — same rule as LiffBookingClient.tsx), fetches
 * the caller's OWN upcoming bookings, then mounts the existing
 * ManageAppointmentView component UNCHANGED (confirmed portable — zero
 * Next.js routing dependencies, same verification BookingFlow got in Part 2)
 * for whichever one the caller is acting on.
 */
export function LiffManageClient({ locale, clinicName, clinicPhone, cancellationCutoffHours }: LiffManageClientProps) {
  const t = useTranslations('liffManage')
  const [status, setStatus] = useState<Status>({ kind: 'initializing' })

  useEffect(() => {
    let cancelled = false

    async function run(): Promise<void> {
      const liffId = process.env['NEXT_PUBLIC_LIFF_MANAGE_ID']
      if (!liffId) {
        if (!cancelled) setStatus({ kind: 'error' })
        return
      }

      try {
        await liff.init({ liffId })
      } catch {
        if (!cancelled) setStatus({ kind: 'error' })
        return
      }
      if (cancelled) return

      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      const idToken = liff.getIDToken()
      if (!idToken) {
        if (!cancelled) setStatus({ kind: 'error' })
        return
      }

      const result = await lookupLineAppointments({ line_id_token: idToken, locale })
      if (cancelled) return

      if (!result.ok) {
        setStatus({ kind: 'error' })
        return
      }
      if (!result.data.matched) {
        setStatus({ kind: 'notLinked' })
        return
      }
      if (result.data.appointments.length === 0) {
        setStatus({ kind: 'noBookings' })
        return
      }
      if (result.data.appointments.length === 1) {
        setStatus({ kind: 'managing', appointment: result.data.appointments[0]! })
        return
      }
      setStatus({ kind: 'picking', appointments: result.data.appointments })
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; locale is read from the closure at that point, matching LiffBookingClient's own effect
  }, [])

  if (status.kind === 'initializing') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-[var(--color-muted)]">
        {t('loading')}
      </div>
    )
  }

  if (status.kind === 'error') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-[var(--color-error)]">
        {t('error')}
      </div>
    )
  }

  if (status.kind === 'notLinked') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 p-6 text-center">
        <p className="text-base text-[var(--color-text)]">{t('notLinked', { phone: clinicPhone })}</p>
      </div>
    )
  }

  if (status.kind === 'noBookings') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 p-6 text-center">
        <p className="text-base text-[var(--color-text)]">{t('noBookings')}</p>
      </div>
    )
  }

  if (status.kind === 'picking') {
    return (
      <div className="mx-auto max-w-md p-6">
        <LineManagePicker
          appointments={status.appointments}
          onSelect={(appointment) => setStatus({ kind: 'managing', appointment })}
        />
      </div>
    )
  }

  return (
    <div className="booking-flow mx-auto max-w-2xl font-sans">
      <ManageAppointmentView
        clinicName={clinicName}
        clinicPhone={clinicPhone}
        cancellationCutoffHours={cancellationCutoffHours}
        confirmationCode={status.appointment.confirmation_code}
        accessToken={status.appointment.access_token}
      />
    </div>
  )
}
