import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { cancelBooking } from './cancel-booking'
import { createBooking } from './create-booking'
import { SlotUnavailableError } from './errors'
import { createCustomer, createResource, createService, createSlot, getSlot } from './test/factories'
import { getTestPayload } from './test/payload'

let payload: Payload
let resourceId: number | string
let serviceId: number | string
let customerId: number | string

beforeAll(async () => {
  payload = await getTestPayload()
  resourceId = (await createResource(payload)).id
  serviceId = (await createService(payload)).id
  customerId = (await createCustomer(payload)).id
})

function bookingInput(slotId: number | string, overrides: Record<string, unknown> = {}) {
  return {
    slotId,
    customerId,
    serviceId,
    visitType: 'first' as const,
    scheduledAt: new Date().toISOString(),
    idempotencyKey: `k-${Math.random().toString(36).slice(2)}`,
    source: 'web',
    ...overrides,
  }
}

const bookedCount = (slot: { [k: string]: unknown }) => slot['bookedCount'] as number

describe('atomic capacity claim', () => {
  it('50 parallel attempts on a capacity-1 slot yield exactly 1 success', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    const results = await Promise.allSettled(
      Array.from({ length: 50 }, () => createBooking(payload, bookingInput(slot.id))),
    )

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    expect(fulfilled).toHaveLength(1)
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(1)
  })

  it('50 parallel attempts on a capacity-3 slot yield exactly 3 successes', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 3 })

    const results = await Promise.allSettled(
      Array.from({ length: 50 }, () => createBooking(payload, bookingInput(slot.id))),
    )

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    expect(fulfilled).toHaveLength(3)
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(3)
  })
})

describe('idempotency', () => {
  it('the same idempotency_key sent twice yields one appointment and the same confirmation_code', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 5 })
    const idempotencyKey = `idem-${Math.random().toString(36).slice(2)}`

    const first = await createBooking(payload, bookingInput(slot.id, { idempotencyKey }))
    const second = await createBooking(payload, bookingInput(slot.id, { idempotencyKey }))

    expect(second.appointment.confirmationCode).toBe(first.appointment.confirmationCode)

    const matches = await payload.find({
      collection: 'appointments',
      where: { idempotencyKey: { equals: idempotencyKey } },
      limit: 100,
    })
    expect(matches.totalDocs).toBe(1)
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(1)
  })
})

describe('unavailable slots', () => {
  it('booking a blocked slot fails cleanly without consuming capacity', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1, status: 'blocked' })

    await expect(createBooking(payload, bookingInput(slot.id))).rejects.toBeInstanceOf(
      SlotUnavailableError,
    )
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(0)
  })

  it('booking a closed slot fails cleanly without consuming capacity', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1, status: 'closed' })

    await expect(createBooking(payload, bookingInput(slot.id))).rejects.toBeInstanceOf(
      SlotUnavailableError,
    )
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(0)
  })
})

describe('cancellation', () => {
  it('cancelling an appointment decrements booked_count and frees the slot for rebooking', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    const booked = await createBooking(payload, bookingInput(slot.id))
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(1)

    await cancelBooking(payload, booked.appointment.id)
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(0)

    const rebooked = await createBooking(payload, bookingInput(slot.id))
    expect(rebooked.appointment.id).toBeDefined()
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(1)
  })

  it('N concurrent cancels of the same appointment release capacity exactly once', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    const booked = await createBooking(payload, bookingInput(slot.id))

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => cancelBooking(payload, booked.appointment.id)),
    )

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true)
    // booked_count must not go negative or be double-decremented.
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(0)
    const didRealWork = results.filter(
      (r) => r.status === 'fulfilled' && r.value.alreadyCancelled === false,
    )
    expect(didRealWork).toHaveLength(1)
  })
})

describe('access control', () => {
  it('denies external writes to engine-managed slot fields (overrideAccess: false)', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    await expect(
      payload.update({
        collection: 'slots',
        id: slot.id,
        data: { capacity: 999 },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('input validation', () => {
  it('rejects an empty idempotency key before opening a transaction', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    await expect(
      createBooking(payload, bookingInput(slot.id, { idempotencyKey: '' })),
    ).rejects.toThrow()
    expect(bookedCount(await getSlot(payload, slot.id))).toBe(0)
  })

  it('rejects an invalid visitType', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    await expect(
      createBooking(payload, bookingInput(slot.id, { visitType: 'walk-in' })),
    ).rejects.toThrow()
  })
})
