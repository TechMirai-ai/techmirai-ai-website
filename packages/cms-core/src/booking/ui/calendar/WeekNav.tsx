'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekNavProps {
  weekRangeLabel: string
  onPrevWeek: () => void
  onNextWeek: () => void
  canGoPrev: boolean
  prevLabel: string
  nextLabel: string
}

/** Prev/next week navigation. Previous is disabled once the visible week is the one containing today. */
export function WeekNav({ weekRangeLabel, onPrevWeek, onNextWeek, canGoPrev, prevLabel, nextLabel }: WeekNavProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onPrevWeek}
        disabled={!canGoPrev}
        aria-label={prevLabel}
        className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-md text-[var(--booking-accent)] transition-colors duration-[var(--booking-transition-duration)] ease-out hover:bg-[var(--booking-border)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <p className="text-base font-medium text-[var(--booking-text)]">{weekRangeLabel}</p>
      <button
        type="button"
        onClick={onNextWeek}
        aria-label={nextLabel}
        className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-md text-[var(--booking-accent)] transition-colors duration-[var(--booking-transition-duration)] ease-out hover:bg-[var(--booking-border)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
