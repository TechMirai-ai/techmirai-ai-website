import type { Payload, Where } from 'payload'

import { BookingApiError } from './errors'
import { assertResourceActive, assertServiceActive } from './entities'
import type { SlotDoc } from './entities'
import { isValidCalendarDate } from './schemas'
import type { AvailabilityRequest, AvailabilityResponse } from './schemas'
import { BOOKING_UTC_OFFSET, toBookingDate } from '../time-zone'

/** Cache-Control max-age applied by the route handler — a plain HTTP TTL, no cache store. */
export const AVAILABILITY_CACHE_TTL_SECONDS = 30

const MAX_RANGE_DAYS = 31
/** Defensive bound so an accidentally huge range can't force an unbounded query. */
const MAX_SLOTS_RETURNED = 1000

function assertValidRange(from: string, to: string): void {
  // Defense in depth: the route validates this via schemas.ts's dateOnlySchema
  // before calling here, but handleAvailability is an exported boundary in
  // its own right — trusting an un-round-trip-checked date string would let
  // a value like "2027-02-30" reach the database query below as a raw literal.
  if (!isValidCalendarDate(from) || !isValidCalendarDate(to)) {
    throw new BookingApiError('INVALID_INPUT', 'from/to must be valid calendar dates')
  }
  if (from > to) {
    throw new BookingApiError('INVALID_INPUT', '`from` must not be after `to`')
  }
  const days = (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000
  if (days > MAX_RANGE_DAYS) {
    throw new BookingApiError('INVALID_INPUT', `The requested range must not exceed ${MAX_RANGE_DAYS} days`)
  }
}

/**
 * Slots in [from, to], grouped by booking-zone (Asia/Tokyo, see
 * ../time-zone.ts) calendar date — including
 * fully-booked ones (remaining_capacity: 0), so the client can distinguish a
 * full slot from a time with no slot at all. service_id is validated but
 * does not filter results — see the comment on
 * availabilityRequestSchema.service_id in schemas.ts for why.
 */
export async function handleAvailability(payload: Payload, input: AvailabilityRequest): Promise<AvailabilityResponse> {
  assertValidRange(input.from, input.to)
  await assertServiceActive(payload, input.service_id)
  if (input.resource_id !== undefined) {
    await assertResourceActive(payload, input.resource_id)
  }

  const where: Where = {
    status: { equals: 'open' },
    startsAt: {
      // [from 00:00, to 23:59:59.999] in the booking zone, passed to the
      // database as UTC ISO instants (same format the query always used).
      greater_than_equal: new Date(`${input.from}T00:00:00.000${BOOKING_UTC_OFFSET}`).toISOString(),
      less_than_equal: new Date(`${input.to}T23:59:59.999${BOOKING_UTC_OFFSET}`).toISOString(),
    },
  }
  if (input.resource_id !== undefined) {
    where.resource = { equals: input.resource_id }
  }

  const result = await payload.find({
    collection: 'slots',
    where,
    depth: 0,
    limit: MAX_SLOTS_RETURNED,
    sort: 'startsAt',
  })

  const grouped = new Map<string, AvailabilityResponse['dates'][number]['slots']>()
  for (const doc of result.docs as unknown as SlotDoc[]) {
    const remaining = Math.max(0, doc.capacity - doc.bookedCount)

    const date = toBookingDate(doc.startsAt)
    const slots = grouped.get(date) ?? []
    slots.push({
      slot_id: doc.id,
      resource_id: doc.resource,
      starts_at: doc.startsAt,
      ends_at: doc.endsAt,
      capacity: doc.capacity,
      remaining_capacity: remaining,
    })
    grouped.set(date, slots)
  }

  const dates = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({ date, slots }))

  return { dates }
}
