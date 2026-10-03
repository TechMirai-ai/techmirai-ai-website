'use client'

import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface StepShellProps {
  title: string
  backLabel?: string
  onBack?: () => void
  progress?: ReactNode
  children: ReactNode
}

/**
 * Shared chrome for every flow step: back button + heading + progress bar.
 * Deliberately contains no page layout (no Container/Section) — those belong
 * to whatever page mounts BookingFlow, not to the component itself.
 */
export function StepShell({ title, backLabel, onBack, progress, children }: StepShellProps) {
  return (
    <div className="flex flex-col gap-6">
      {progress}
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-md text-[var(--booking-accent)] transition-colors duration-[var(--booking-transition-duration)] ease-out hover:bg-[var(--booking-border)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <h2 className="text-xl font-semibold text-[var(--booking-accent)]">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}
