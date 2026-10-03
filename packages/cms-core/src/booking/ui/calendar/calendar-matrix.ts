import type { AvailabilityResponse } from '../../api/schemas'
import type { SelectedSlot } from '../flow/types'

export interface CalendarCellData {
  capacity: number
  remainingCapacity: number
  /**
   * The specific slot to actually reserve if this cell is selected. The flow
   * has no separate resource-picking step, so same-time slots from
   * different resources are collapsed into one cell — this is the one with
   * the most remaining capacity among them. Undefined when every same-time
   * slot is full (the cell still renders, as ×, but isn't selectable).
   */
  representativeSlot: SelectedSlot | undefined
}

export interface CalendarMatrixRow {
  /** "HH:MM", UTC, matching the API's starts_at convention. */
  time: string
  cellsByDate: Record<string, CalendarCellData | undefined>
}

export function buildCalendarMatrix(availability: AvailabilityResponse, weekDates: string[]): CalendarMatrixRow[] {
  const slotsByDate = new Map(availability.dates.map((d) => [d.date, d.slots]))

  const times = new Set<string>()
  for (const date of weekDates) {
    for (const slot of slotsByDate.get(date) ?? []) {
      times.add(slot.starts_at.slice(11, 16))
    }
  }

  return [...times].sort().map((time) => {
    const cellsByDate: Record<string, CalendarCellData | undefined> = {}
    for (const date of weekDates) {
      const slotsAtTime = (slotsByDate.get(date) ?? []).filter((slot) => slot.starts_at.slice(11, 16) === time)
      if (slotsAtTime.length === 0) continue

      const capacity = slotsAtTime.reduce((sum, slot) => sum + slot.capacity, 0)
      const remainingCapacity = slotsAtTime.reduce((sum, slot) => sum + slot.remaining_capacity, 0)
      const best = slotsAtTime.reduce((a, b) => (b.remaining_capacity > a.remaining_capacity ? b : a))

      cellsByDate[date] = {
        capacity,
        remainingCapacity,
        representativeSlot:
          best.remaining_capacity > 0
            ? { slotId: best.slot_id, resourceId: best.resource_id, startsAt: best.starts_at, endsAt: best.ends_at }
            : undefined,
      }
    }
    return { time, cellsByDate }
  })
}
