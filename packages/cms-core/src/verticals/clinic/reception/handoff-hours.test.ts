import { describe, expect, it } from 'vitest'
import { isWithinHandoffHours, type HandoffHours } from './handoff-hours'

// Written in Asia/Tokyo (UTC+9, no daylight saving). The schedule below is the
// proposed one from site.config.ts — an unconfirmed launch blocker (register
// K2-01) — used here only as a fixture.
const HOURS: HandoffHours = { timeZone: 'Asia/Tokyo', days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }

/** A JST wall-clock time as a Date. 2026-10-12 is a Monday. */
function jst(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+09:00`)
}

describe('isWithinHandoffHours', () => {
  it('is open on a weekday inside the window', () => {
    expect(isWithinHandoffHours(jst('2026-10-13', '10:30'), HOURS)).toBe(true)
  })

  it('is closed at 23:00 on a weekday — Spec §16.7 row 15', () => {
    expect(isWithinHandoffHours(jst('2026-10-13', '23:00'), HOURS)).toBe(false)
  })

  it('includes the start minute and excludes the end minute', () => {
    expect(isWithinHandoffHours(jst('2026-10-13', '09:00'), HOURS)).toBe(true)
    expect(isWithinHandoffHours(jst('2026-10-13', '08:59'), HOURS)).toBe(false)
    expect(isWithinHandoffHours(jst('2026-10-13', '17:59'), HOURS)).toBe(true)
    expect(isWithinHandoffHours(jst('2026-10-13', '18:00'), HOURS)).toBe(false)
  })

  it('is closed on a Saturday and a Sunday even at midday', () => {
    expect(isWithinHandoffHours(jst('2026-10-17', '12:00'), HOURS)).toBe(false)
    expect(isWithinHandoffHours(jst('2026-10-18', '12:00'), HOURS)).toBe(false)
  })

  it('reads the clock in the configured zone, not the server\'s', () => {
    // 01:30 UTC on Tuesday is 10:30 Tuesday in Tokyo — open — though it is the
    // small hours in UTC.
    expect(isWithinHandoffHours(new Date('2026-10-13T01:30:00Z'), HOURS)).toBe(true)
    // 23:30 UTC on Monday is 08:30 Tuesday in Tokyo — not yet open.
    expect(isWithinHandoffHours(new Date('2026-10-12T23:30:00Z'), HOURS)).toBe(false)
  })

  it('moves to the next calendar day across the zone boundary', () => {
    // 20:00 UTC Friday is 05:00 Saturday in Tokyo: closed, and Saturday is not a listed day.
    expect(isWithinHandoffHours(new Date('2026-10-16T20:00:00Z'), HOURS)).toBe(false)
  })

  it('honours a different zone', () => {
    const utc: HandoffHours = { ...HOURS, timeZone: 'UTC' }
    expect(isWithinHandoffHours(new Date('2026-10-13T10:00:00Z'), utc)).toBe(true)
    expect(isWithinHandoffHours(new Date('2026-10-13T01:30:00Z'), utc)).toBe(false)
  })

  it('returns null — cannot tell — for a malformed time or an unknown zone, never a guess', () => {
    expect(isWithinHandoffHours(jst('2026-10-13', '10:00'), { ...HOURS, start: '9am' })).toBeNull()
    expect(isWithinHandoffHours(jst('2026-10-13', '10:00'), { ...HOURS, end: '25:00' })).toBeNull()
    expect(isWithinHandoffHours(jst('2026-10-13', '10:00'), { ...HOURS, timeZone: 'Not/AZone' })).toBeNull()
  })
})
