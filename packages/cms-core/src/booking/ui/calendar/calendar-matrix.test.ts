import { describe, expect, it } from 'vitest'

import { buildCalendarMatrix } from './calendar-matrix'

const weekDates = ['2027-01-04', '2027-01-05']

describe('buildCalendarMatrix', () => {
  it('builds one row per distinct time-of-day observed across the week', () => {
    const rows = buildCalendarMatrix(
      {
        dates: [
          {
            date: '2027-01-04',
            slots: [
              { slot_id: 1, resource_id: 10, starts_at: '2027-01-04T01:00:00.000Z', ends_at: '2027-01-04T01:30:00.000Z', capacity: 3, remaining_capacity: 2 },
            ],
          },
          {
            date: '2027-01-05',
            slots: [
              { slot_id: 2, resource_id: 10, starts_at: '2027-01-05T02:00:00.000Z', ends_at: '2027-01-05T02:30:00.000Z', capacity: 3, remaining_capacity: 0 },
            ],
          },
        ],
      },
      weekDates,
    )

    expect(rows.map((r) => r.time)).toEqual(['01:00', '02:00'])
  })

  it('marks a cell as undefined (closed) when no slot exists for that date/time', () => {
    const rows = buildCalendarMatrix(
      {
        dates: [
          {
            date: '2027-01-04',
            slots: [
              { slot_id: 1, resource_id: 10, starts_at: '2027-01-04T01:00:00.000Z', ends_at: '2027-01-04T01:30:00.000Z', capacity: 3, remaining_capacity: 2 },
            ],
          },
        ],
      },
      weekDates,
    )

    const row = rows.find((r) => r.time === '01:00')!
    expect(row.cellsByDate['2027-01-04']).toBeDefined()
    expect(row.cellsByDate['2027-01-05']).toBeUndefined()
  })

  it('aggregates multiple same-time slots across different resources into one cell', () => {
    const rows = buildCalendarMatrix(
      {
        dates: [
          {
            date: '2027-01-04',
            slots: [
              { slot_id: 1, resource_id: 10, starts_at: '2027-01-04T01:00:00.000Z', ends_at: '2027-01-04T01:30:00.000Z', capacity: 1, remaining_capacity: 1 },
              { slot_id: 2, resource_id: 11, starts_at: '2027-01-04T01:00:00.000Z', ends_at: '2027-01-04T01:30:00.000Z', capacity: 2, remaining_capacity: 0 },
            ],
          },
        ],
      },
      ['2027-01-04'],
    )

    const cell = rows[0]!.cellsByDate['2027-01-04']!
    expect(cell.capacity).toBe(3)
    expect(cell.remainingCapacity).toBe(1)
    // Picks the slot with the most remaining capacity as the one to actually book.
    expect(cell.representativeSlot).toEqual({
      slotId: 1,
      resourceId: 10,
      startsAt: '2027-01-04T01:00:00.000Z',
      endsAt: '2027-01-04T01:30:00.000Z',
    })
  })

  it('has no representativeSlot when every same-time slot is full', () => {
    const rows = buildCalendarMatrix(
      {
        dates: [
          {
            date: '2027-01-04',
            slots: [
              { slot_id: 1, resource_id: 10, starts_at: '2027-01-04T01:00:00.000Z', ends_at: '2027-01-04T01:30:00.000Z', capacity: 1, remaining_capacity: 0 },
            ],
          },
        ],
      },
      ['2027-01-04'],
    )

    expect(rows[0]!.cellsByDate['2027-01-04']!.representativeSlot).toBeUndefined()
  })

  it('returns no rows when the week has no slots at all', () => {
    const rows = buildCalendarMatrix({ dates: [] }, weekDates)
    expect(rows).toEqual([])
  })
})
