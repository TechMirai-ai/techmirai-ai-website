'use client'

import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { useTranslations } from 'next-intl'
import { BookingFlow } from '@techmirai/cms-core/booking/ui'
import { lookupLineCustomer } from '@techmirai/cms-core/booking/client'
import type { CustomerInput } from '@techmirai/cms-core/booking/api'

interface LiffBookingClientProps {
  locale: string
  clinicName: string
}

type Status =
  | { kind: 'initializing' }
  | { kind: 'error' }
  // item 6: a matched returning patient sees the confirm screen first.
  | { kind: 'confirmShortcut'; idToken: string; customer: CustomerInput }
  // item 1/3: the ordinary full-form flow — shortcut undefined for a
  // first-time booker, or set after "Continue as [name]?" is confirmed.
  | { kind: 'booking'; idToken: string; contactPrefill?: { given_name: string }; shortcut?: CustomerInput }

/**
 * LIFF booking page shell — STEP 2 Part 2 item 1. Calls liff.init(), waits
 * for it to resolve, then mounts the existing BookingFlow component
 * UNCHANGED for the ordinary path (docs/STEP2-AUDIT.md confirmed it has
 * zero Next.js routing dependencies; this file adds none either).
 */
export function LiffBookingClient({ locale, clinicName }: LiffBookingClientProps) {
  const t = useTranslations('liffBooking')
  const [status, setStatus] = useState<Status>({ kind: 'initializing' })

  useEffect(() => {
    let cancelled = false

    async function run(): Promise<void> {
      const liffId = process.env['NEXT_PUBLIC_LIFF_ID']
      if (!liffId) {
        if (!cancelled) setStatus({ kind: 'error' })
        return
      }

      try {
        // https://developers.line.biz/en/docs/liff/developing-liff-apps/ —
        // every other LIFF API call must wait for this Promise to resolve.
        await liff.init({ liffId })
      } catch {
        if (!cancelled) setStatus({ kind: 'error' })
        return
      }
      if (cancelled) return

      // STEP 2 Part 2 item 2: liff.login() is a no-op inside the LINE
      // in-app browser (login already happened automatically during
      // init there) but is required when this URL was opened in a plain
      // external browser. Calling it navigates away to LINE's login page
      // and back — nothing after this matters until the redirected reload
      // re-runs this effect with isLoggedIn() now true.
      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      // https://developers.line.biz/en/docs/line-login/verify-id-token/ —
      // this raw token is verified server-side (never a client-asserted
      // lineUserId) before anything trusts it. liff.getProfile()'s
      // displayName below is used ONLY for client-side display (a name
      // suggestion), per LINE's own guidance never sent to the server.
      const idToken = liff.getIDToken()
      if (!idToken) {
        if (!cancelled) setStatus({ kind: 'error' })
        return
      }

      const lookupResult = await lookupLineCustomer({ line_id_token: idToken })
      if (cancelled) return

      if (lookupResult.ok && lookupResult.data.matched) {
        setStatus({ kind: 'confirmShortcut', idToken, customer: lookupResult.data.customer })
        return
      }

      // No match (or the lookup itself failed) — this convenience check
      // must never block booking; fall through to the normal full-form
      // flow (STEP 2 Part 2 items 1–3).
      let displayName: string | undefined
      try {
        const profile = await liff.getProfile()
        displayName = profile.displayName
      } catch {
        // Non-fatal — proceed without a name suggestion.
      }
      if (cancelled) return
      setStatus({ kind: 'booking', idToken, ...(displayName ? { contactPrefill: { given_name: displayName } } : {}) })
    }

    run()
    return () => {
      cancelled = true
    }
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

  if (status.kind === 'confirmShortcut') {
    const name = `${status.customer.family_name} ${status.customer.given_name}`
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-6 text-center">
        <p className="text-lg font-semibold text-[var(--color-text)]">{t('confirmTitle', { name })}</p>
        <p className="text-sm text-[var(--color-muted)]">{t('confirmHint')}</p>
        <div className="mt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={() =>
              setStatus({ kind: 'booking', idToken: status.idToken, shortcut: status.customer })
            }
            className="min-h-[48px] rounded-md bg-[var(--color-button-accent,var(--color-primary))] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-button-accent-hover,var(--color-primary))]"
          >
            {t('confirmYes')}
          </button>
          <button
            type="button"
            onClick={() => setStatus({ kind: 'booking', idToken: status.idToken })}
            className="min-h-[48px] rounded-md border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-alt,var(--color-surface))]"
          >
            {t('confirmNo')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <BookingFlow
      locale={locale}
      clinicName={clinicName}
      className="mx-auto max-w-2xl"
      lineIdToken={status.idToken}
      {...(status.shortcut ? { initialVisitType: 'return' as const, initialCustomer: status.shortcut } : {})}
      {...(status.contactPrefill ? { contactPrefill: status.contactPrefill } : {})}
    />
  )
}
