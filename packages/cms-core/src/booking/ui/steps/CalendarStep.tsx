'use client'

import { useLocale, useTranslations } from 'next-intl'

import { CalendarGrid } from '../calendar/CalendarGrid'
import type { AvailabilityLabelKey } from '../calendar/availability-symbol'
import { getWeekDates } from '../calendar/week'
import { BookingButton } from '../shared/BookingButton'
import { ProgressIndicator } from '../shared/ProgressIndicator'
import { StepShell } from '../shared/StepShell'
import type { AvailabilityResponse } from '../../api/schemas'
import type { SelectedSlot } from '../flow/types'

interface CalendarStepProps {
  weekStart: Date
  availability: AvailabilityResponse | null
  isLoading: boolean
  selectedSlot?: SelectedSlot | undefined
  onSelectSlot: (slot: SelectedSlot) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  canGoPrevWeek: boolean
  onContinue: () => void
  onBack: () => void
}

/** Step 3: calendar grid — pick a slot. */
export function CalendarStep({
  weekStart,
  availability,
  isLoading,
  selectedSlot,
  onSelectSlot,
  onPrevWeek,
  onNextWeek,
  canGoPrevWeek,
  onContinue,
  onBack,
}: CalendarStepProps) {
  const t = useTranslations('blocks.booking')
  const locale = useLocale()

  const weekDates = getWeekDates(weekStart)
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

  return (
    <StepShell
      title={t('calendar.title')}
      backLabel={t('nav.back')}
      onBack={onBack}
      progress={<ProgressIndicator current={3} total={6} label={t('progress.stepLabel', { n: 3, total: 6 })} />}
    >
      {isLoading && !availability ? (
        <p className="text-[var(--booking-text-muted)]">{t('calendar.loading')}</p>
      ) : (
        <CalendarGrid
          weekStart={weekStart}
          availability={availability ?? { dates: [] }}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
          onPrevWeek={onPrevWeek}
          onNextWeek={onNextWeek}
          canGoPrevWeek={canGoPrevWeek}
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
      <div className="mt-6">
        <BookingButton type="button" disabled={!selectedSlot} onClick={onContinue}>
          {t('contact.continue')}
        </BookingButton>
      </div>
    </StepShell>
  )
}
