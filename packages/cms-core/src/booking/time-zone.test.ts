import { describe, expect, it } from 'vitest'

import { BOOKING_TIME_ZONE, BOOKING_UTC_OFFSET, toBookingDate, toBookingTime } from './time-zone'

describe('booking time zone (approved decision D2: Asia/Tokyo)', () => {
  it('is Asia/Tokyo with the matching fixed +09:00 offset (no DST)', () => {
    expect(BOOKING_TIME_ZONE).toBe('Asia/Tokyo')
    expect(BOOKING_UTC_OFFSET).toBe('+09:00')
  })

  it('shows 00:00Z as 09:00 and 09:00Z as 18:00 — the 9:00–18:00 JST window as stored instants', () => {
    expect(toBookingTime('2027-01-04T00:00:00.000Z')).toBe('09:00')
    expect(toBookingTime('2027-01-04T09:00:00.000Z')).toBe('18:00')
  })

  it('keeps the same calendar date for the whole 9:00–18:00 JST window', () => {
    expect(toBookingDate('2027-01-04T00:00:00.000Z')).toBe('2027-01-04')
    expect(toBookingDate('2027-01-04T08:59:00.000Z')).toBe('2027-01-04')
  })

  it('rolls the date forward from 15:00Z (JST midnight), where the UTC date differs', () => {
    expect(toBookingDate('2027-01-04T14:59:00.000Z')).toBe('2027-01-04')
    expect(toBookingDate('2027-01-04T15:00:00.000Z')).toBe('2027-01-05')
    expect(toBookingTime('2027-01-04T15:00:00.000Z')).toBe('00:00')
  })

  it('never renders midnight as 24:00', () => {
    expect(toBookingTime('2027-01-04T15:30:00.000Z')).toBe('00:30')
  })
})
