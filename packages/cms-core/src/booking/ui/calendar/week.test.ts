import { describe, expect, it } from 'vitest'

import { addDays, canGoToPreviousWeek, getWeekDates, startOfWeek, toDateOnlyString } from './week'

describe('startOfWeek', () => {
  it('returns the same Monday when given a Monday', () => {
    const monday = new Date('2027-01-04T15:00:00.000Z')
    expect(toDateOnlyString(startOfWeek(monday))).toBe('2027-01-04')
  })

  it('returns the preceding Monday when given a mid-week date', () => {
    const wednesday = new Date('2027-01-06T15:00:00.000Z')
    expect(toDateOnlyString(startOfWeek(wednesday))).toBe('2027-01-04')
  })

  it('returns the preceding Monday when given a Sunday', () => {
    const sunday = new Date('2027-01-10T15:00:00.000Z')
    expect(toDateOnlyString(startOfWeek(sunday))).toBe('2027-01-04')
  })
})

describe('addDays / getWeekDates', () => {
  it('addDays advances by the given number of calendar days', () => {
    const start = new Date('2027-01-04T00:00:00.000Z')
    expect(toDateOnlyString(addDays(start, 3))).toBe('2027-01-07')
  })

  it('getWeekDates returns exactly 7 consecutive days starting from weekStart', () => {
    const weekStart = new Date('2027-01-04T00:00:00.000Z')
    const dates = getWeekDates(weekStart).map(toDateOnlyString)
    expect(dates).toEqual(['2027-01-04', '2027-01-05', '2027-01-06', '2027-01-07', '2027-01-08', '2027-01-09', '2027-01-10'])
  })
})

describe('canGoToPreviousWeek', () => {
  it('disallows navigating back from the week that contains today', () => {
    const today = new Date('2027-01-06T12:00:00.000Z')
    const thisWeekStart = startOfWeek(today)
    expect(canGoToPreviousWeek(thisWeekStart, today)).toBe(false)
  })

  it('disallows navigating back from a week entirely in the past (defensive — should not be reachable via UI)', () => {
    const today = new Date('2027-01-06T12:00:00.000Z')
    const pastWeekStart = new Date('2026-12-28T00:00:00.000Z')
    expect(canGoToPreviousWeek(pastWeekStart, today)).toBe(false)
  })

  it('allows navigating back from a future week, down to the week containing today', () => {
    const today = new Date('2027-01-06T12:00:00.000Z')
    const futureWeekStart = new Date('2027-01-18T00:00:00.000Z')
    expect(canGoToPreviousWeek(futureWeekStart, today)).toBe(true)
  })
})
