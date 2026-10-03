'use client'

import { getAvailabilityTier, isTierSelectable } from './availability-symbol'
import type { AvailabilityLabelKey } from './availability-symbol'
import { buildCalendarMatrix } from './calendar-matrix'
import { CalendarCell } from './CalendarCell'
import { getWeekDates, toDateOnlyString } from './week'
import { WeekNav } from './WeekNav'
import type { AvailabilityResponse } from '../../api/schemas'
import type { SelectedSlot } from '../flow/types'

interface CalendarGridProps {
  weekStart: Date
  availability: AvailabilityResponse
  selectedSlot?: SelectedSlot | undefined
  onSelectSlot: (slot: SelectedSlot) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  canGoPrevWeek: boolean
  /** 7 short weekday labels, Monday-first, already translated by the caller. */
  weekdayLabels: string[]
  weekRangeLabel: string
  prevWeekLabel: string
  nextWeekLabel: string
  legendLabels: Record<AvailabilityLabelKey, string>
  getSlotAriaLabel: (args: { date: string; time: string; labelKey: AvailabilityLabelKey }) => string
}

const LEGEND_ORDER: AvailabilityLabelKey[] = ['plenty', 'available', 'few', 'full', 'closed']
const SYMBOL_BY_LABEL: Record<AvailabilityLabelKey, string> = {
  plenty: '◎',
  available: '○',
  few: '△',
  full: '×',
  closed: '−',
}

/**
 * Week view: days as columns, time slots as rows — the Japanese convention.
 * Presentational only; the caller (CalendarStep/useBookingFlow) owns
 * fetching availability and knowing "today" for the past-week guard.
 */
export function CalendarGrid({
  weekStart,
  availability,
  selectedSlot,
  onSelectSlot,
  onPrevWeek,
  onNextWeek,
  canGoPrevWeek,
  weekdayLabels,
  weekRangeLabel,
  prevWeekLabel,
  nextWeekLabel,
  legendLabels,
  getSlotAriaLabel,
}: CalendarGridProps) {
  const weekDates = getWeekDates(weekStart).map(toDateOnlyString)
  const rows = buildCalendarMatrix(availability, weekDates)

  return (
    <div className="flex flex-col gap-4">
      <WeekNav
        weekRangeLabel={weekRangeLabel}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        canGoPrev={canGoPrevWeek}
        prevLabel={prevWeekLabel}
        nextLabel={nextWeekLabel}
      />

      {/*
       * 7 columns of 48px-minimum tap targets plus the time-label column
       * cannot fit inside a 320px viewport (7*48=336px alone). Scrolling
       * horizontally within this one bounded container — not the whole
       * page — keeps every cell at its full 48px tap-target size at any
       * viewport width instead of shrinking cells below the minimum.
       *
       * No role="grid"/"row"/"gridcell" here: the ARIA APG grid pattern
       * requires arrow-key navigation between cells, which this component
       * doesn't implement (cells are just sequentially-tabbable buttons).
       * Advertising grid semantics without that behavior sends screen
       * readers into a navigation mode with no way out. Each cell's
       * accessible name already carries full date+time context via its own
       * aria-label, so no information is lost by using plain layout divs.
       * Full roving-tabindex/arrow-key grid navigation is real feature
       * work, not a quick fix — tracked, due before WO-8 (production
       * go-live), not left open-ended.
       *
       * min-w-0 is NOT redundant with overflow-x-auto: this div is a flex
       * item (parent is flex-col), and a flex item's automatic min-width
       * is only spec'd to resolve to 0 (letting overflow:auto actually
       * clip/scroll instead of stretching the item to its content's
       * max-content size) when the browser correctly implements that
       * "automatic minimum size" rule. Chromium does; WebKit has long-
       * standing, documented gaps here — without this, the child grid's
       * ~430px max-content width (see minWidth: max-content below) can
       * inflate THIS div, and everything up the ancestor chain with it,
       * on WebKit-based browsers (e.g. LINE's iOS in-app browser) even
       * though Chromium (incl. every desktop/devtools mobile emulation)
       * contains it correctly — a real, engine-specific discrepancy that
       * mobile-viewport emulation cannot surface.
       */}
      <div className="min-w-0 overflow-x-auto">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `3.5rem repeat(${weekDates.length}, minmax(48px, 1fr))`, minWidth: 'max-content' }}
        >
          <div className="contents">
            {/* Empty corner cell above the time-row headers — not a real column header. */}
            <div aria-hidden="true" />
            {weekDates.map((date, i) => (
              <div key={date} className="text-center text-sm font-medium text-[var(--booking-text-muted)]">
                <div>{weekdayLabels[i]}</div>
                <div>{Number(date.slice(8, 10))}</div>
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div key={row.time} className="contents">
              <div className="flex items-center justify-end pr-1 text-sm text-[var(--booking-text-muted)]">
                {row.time}
              </div>
              {weekDates.map((date) => {
                const cell = row.cellsByDate[date]
                const tier = getAvailabilityTier(
                  cell ? { capacity: cell.capacity, remaining_capacity: cell.remainingCapacity } : undefined,
                )
                const isSelectable = isTierSelectable(tier.labelKey) && !!cell?.representativeSlot
                const isSelected =
                  !!selectedSlot && !!cell?.representativeSlot && selectedSlot.slotId === cell.representativeSlot.slotId

                return (
                  <CalendarCell
                    key={`${row.time}-${date}`}
                    tier={tier}
                    isSelected={isSelected}
                    isSelectable={isSelectable}
                    ariaLabel={getSlotAriaLabel({ date, time: row.time, labelKey: tier.labelKey })}
                    onSelect={() => {
                      if (cell?.representativeSlot) onSelectSlot(cell.representativeSlot)
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--booking-text-muted)]">
        {LEGEND_ORDER.map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span aria-hidden="true">{SYMBOL_BY_LABEL[key]}</span>
            <span>{legendLabels[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
