import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { handleAvailability } from './availability'
import { BookingApiError } from './errors'
import { createResource, createService } from '../test/factories'
import { getTestPayload } from '../test/payload'

let payload: Payload
let resourceId: number | string
let otherResourceId: number | string
let serviceId: number | string

const FROM = '2027-01-04'
const TO = '2027-01-10'

async function createSlotWithBookedCount(args: {
  resourceId: number | string
  startsAt: string
  endsAt: string
  capacity?: number
  bookedCount?: number
  status?: 'open' | 'blocked' | 'closed'
}) {
  return payload.create({
    collection: 'slots',
    data: {
      resource: args.resourceId,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      capacity: args.capacity ?? 1,
      bookedCount: args.bookedCount ?? 0,
      status: args.status ?? 'open',
    },
  })
}

beforeAll(async () => {
  payload = await getTestPayload()
  resourceId = (await createResource(payload)).id
  otherResourceId = (await createResource(payload, { name: '診察室B' })).id
  serviceId = (await createService(payload)).id
})

describe('handleAvailability', () => {
  it('returns open slots grouped by date, within the requested range', async () => {
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${FROM}T01:00:00.000Z`,
      endsAt: `${FROM}T01:30:00.000Z`,
    })
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${TO}T02:00:00.000Z`,
      endsAt: `${TO}T02:30:00.000Z`,
    })
    // Outside the requested range — must not appear.
    await createSlotWithBookedCount({
      resourceId,
      startsAt: '2027-02-01T01:00:00.000Z',
      endsAt: '2027-02-01T01:30:00.000Z',
    })

    const result = await handleAvailability(payload, { from: FROM, to: TO, service_id: serviceId })

    const dates = result.dates.map((d) => d.date)
    expect(dates).toContain(FROM)
    expect(dates).toContain(TO)
    expect(dates).not.toContain('2027-02-01')
  })

  it('groups and range-filters by the booking-zone (Asia/Tokyo) date, not the UTC date', async () => {
    // 2027-04-01T16:00Z is 2027-04-02 01:00 JST: it belongs to the 2nd, not the 1st.
    await createSlotWithBookedCount({
      resourceId,
      startsAt: '2027-04-01T16:00:00.000Z',
      endsAt: '2027-04-01T16:30:00.000Z',
    })

    const first = await handleAvailability(payload, { from: '2027-04-01', to: '2027-04-01', service_id: serviceId })
    expect(first.dates.find((d) => d.date === '2027-04-01')).toBeUndefined()

    const second = await handleAvailability(payload, { from: '2027-04-02', to: '2027-04-02', service_id: serviceId })
    expect(second.dates.find((d) => d.date === '2027-04-02')?.slots).toHaveLength(1)
  })

  it('excludes blocked and closed slots', async () => {
    const from = '2027-03-01'
    const to = '2027-03-01'
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${from}T01:00:00.000Z`,
      endsAt: `${from}T01:30:00.000Z`,
      status: 'blocked',
    })
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${from}T02:00:00.000Z`,
      endsAt: `${from}T02:30:00.000Z`,
      status: 'closed',
    })

    const result = await handleAvailability(payload, { from, to, service_id: serviceId })

    expect(result.dates.find((d) => d.date === from)).toBeUndefined()
  })

  it('includes full-capacity slots with remaining_capacity 0', async () => {
    const from = '2027-03-02'
    const to = '2027-03-02'
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${from}T01:00:00.000Z`,
      endsAt: `${from}T01:30:00.000Z`,
      capacity: 1,
      bookedCount: 1,
    })

    const result = await handleAvailability(payload, { from, to, service_id: serviceId })

    const slots = result.dates.find((d) => d.date === from)?.slots ?? []
    expect(slots).toHaveLength(1)
    expect(slots[0]?.capacity).toBe(1)
    expect(slots[0]?.remaining_capacity).toBe(0)
  })

  it('reports remaining_capacity as capacity minus bookedCount', async () => {
    const from = '2027-03-03'
    const to = '2027-03-03'
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${from}T01:00:00.000Z`,
      endsAt: `${from}T01:30:00.000Z`,
      capacity: 3,
      bookedCount: 1,
    })

    const result = await handleAvailability(payload, { from, to, service_id: serviceId })

    const slots = result.dates.find((d) => d.date === from)?.slots ?? []
    expect(slots).toHaveLength(1)
    expect(slots[0]?.capacity).toBe(3)
    expect(slots[0]?.remaining_capacity).toBe(2)
  })

  it('filters by resource_id when provided', async () => {
    const from = '2027-03-04'
    const to = '2027-03-04'
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${from}T01:00:00.000Z`,
      endsAt: `${from}T01:30:00.000Z`,
    })
    await createSlotWithBookedCount({
      resourceId: otherResourceId,
      startsAt: `${from}T03:00:00.000Z`,
      endsAt: `${from}T03:30:00.000Z`,
    })

    const result = await handleAvailability(payload, { from, to, service_id: serviceId, resource_id: resourceId })

    const slots = result.dates.find((d) => d.date === from)?.slots ?? []
    expect(slots).toHaveLength(1)
    expect(slots[0]?.resource_id).toBe(resourceId)
  })

  it('does not filter by service_id — only validates it exists', async () => {
    const from = '2027-03-05'
    const to = '2027-03-05'
    await createSlotWithBookedCount({
      resourceId,
      startsAt: `${from}T01:00:00.000Z`,
      endsAt: `${from}T01:30:00.000Z`,
    })

    const otherService = await createService(payload, { name: 'Other Service' })
    const result = await handleAvailability(payload, { from, to, service_id: otherService.id })

    expect(result.dates.find((d) => d.date === from)?.slots).toHaveLength(1)
  })

  it('rejects a nonexistent service_id with INVALID_INPUT', async () => {
    await expect(
      handleAvailability(payload, { from: FROM, to: TO, service_id: 999_999_999 }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' } satisfies Partial<BookingApiError>)
  })

  it('rejects a nonexistent resource_id with INVALID_INPUT', async () => {
    await expect(
      handleAvailability(payload, { from: FROM, to: TO, service_id: serviceId, resource_id: 999_999_999 }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects a range where from is after to', async () => {
    await expect(
      handleAvailability(payload, { from: '2027-01-10', to: '2027-01-01', service_id: serviceId }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects a range longer than the maximum allowed window', async () => {
    await expect(
      handleAvailability(payload, { from: '2027-01-01', to: '2027-12-31', service_id: serviceId }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects a `to` date with an out-of-range calendar month/day instead of hitting the database', async () => {
    // Date.parse('...-13-45...') returns NaN, and `NaN > MAX_RANGE_DAYS` is
    // always false — a naive range-length check silently lets this through
    // to the query layer instead of rejecting it as malformed input.
    await expect(
      handleAvailability(payload, { from: '2027-01-01', to: '2027-13-45', service_id: serviceId }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects a `from` date with an out-of-range calendar month/day', async () => {
    await expect(
      handleAvailability(payload, { from: '2027-02-30', to: '2027-03-01', service_id: serviceId }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })
})
