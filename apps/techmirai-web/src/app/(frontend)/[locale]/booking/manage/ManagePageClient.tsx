'use client'

import { useEffect, useState } from 'react'
import { ManageAppointmentView } from '@techmirai/cms-core/booking/ui'

interface ManagePageClientProps {
  locale: string
  initialCode: string | undefined
  initialToken: string | undefined
  clinicName: string
  clinicPhone: string
  cancellationCutoffHours: number
}

/**
 * Reads the code/token the manage link carried ONCE on mount, then strips
 * them from the address bar — a magic-link credential (see tokens.ts's
 * deriveLinkToken) must not linger in browser history indefinitely.
 * page.tsx (server component) is what actually parses them out of
 * searchParams; this just receives them as props so no useSearchParams()/
 * Suspense boundary is needed.
 */
export function ManagePageClient({
  locale,
  initialCode,
  initialToken,
  clinicName,
  clinicPhone,
  cancellationCutoffHours,
}: ManagePageClientProps) {
  const [credentials] = useState(() => ({ code: initialCode, token: initialToken }))

  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('code') && !url.searchParams.has('token')) return
    url.searchParams.delete('code')
    url.searchParams.delete('token')
    window.history.replaceState(null, '', url.toString())
  }, [])

  if (!credentials.code || !credentials.token) {
    return (
      <p className="text-center text-sm text-[var(--booking-text-muted,#71717a)]">
        {locale === 'ja' ? 'このリンクは無効です。' : 'This link is invalid.'}
      </p>
    )
  }

  return (
    <div className="booking-flow mx-auto max-w-2xl font-sans">
      <ManageAppointmentView
        clinicName={clinicName}
        clinicPhone={clinicPhone}
        cancellationCutoffHours={cancellationCutoffHours}
        confirmationCode={credentials.code}
        accessToken={credentials.token}
      />
    </div>
  )
}
