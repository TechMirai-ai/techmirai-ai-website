import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { handleReschedule } from './reschedule'
import { deriveAccessToken, hashAccessToken } from './tokens'
import { createCustomer, createResource, createService, createSlot, getSlot } from '../test/factories'
import { getTestPayload } from '../test/payload'

let payload: Payload
let resourceId: number | string
let serviceId: number | string
let customerId: number | string

// Every old appointment in this suite defaults to a slot ~1 day out, so a
// 0-hour cutoff never restricts anything — the cutoff itself is exercised
// separately below with an old appointment deliberately scheduled soon.
const NO_CUTOFF = 0

beforeAll(async () => {
  payload = await getTestPayload()
  resourceId = (await createResource(payload)).id
  serviceId = (await createService(payload)).id
  customerId = (await createCustomer(payload)).id
})

beforeEach(() => {
  vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
})

async function bookOldAppointment(startsAt?: string) {
  const slot = await createSlot(payload, { resourceId, capacity: 1, ...(startsAt ? { startsAt } : {}) })
  const idempotencyKey = `old-key-${Math.random().toString(36).slice(2)}`
  const accessToken = deriveAccessToken(idempotencyKey)
  const { createBooking } = await import('../create-booking')
  const { appointment } = await createBooking(payload, {
    slotId: slot.id,
    customerId,
    serviceId,
    visitType: 'first',
    scheduledAt: slot['startsAt'] as string,
    idempotencyKey,
    accessTokenHash: hashAccessToken(accessToken),
    source: 'web',
  })
  return { slot, appointment, accessToken }
}

function newIdempotencyKey(): string {
  return `new-key-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

describe('handleReschedule', () => {
  it('reserves the new slot, cancels the old appointment, and returns new credentials', async () => {
    const { slot: oldSlot, appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()
    const newSlot = await createSlot(payload, { resourceId, capacity: 1 })

    const result = await handleReschedule(
      payload,
      {
        confirmation_code: oldAppointment.confirmationCode,
        access_token: oldAccessToken,
        new_slot_id: newSlot.id,
        new_resource_id: resourceId,
        idempotency_key: newIdempotencyKey(),
      },
      NO_CUTOFF,
    )

    expect(result.confirmation_code).not.toBe(oldAppointment.confirmationCode)
    expect(result.access_token).toEqual(expect.any(String))
    expect(result.link_token).toEqual(expect.any(String))
    expect(result.old_appointment_cancelled).toBe(true)

    const updatedOldSlot = await getSlot(payload, oldSlot.id)
    expect(updatedOldSlot['bookedCount']).toBe(0)
    const updatedNewSlot = await getSlot(payload, newSlot.id)
    expect(updatedNewSlot['bookedCount']).toBe(1)

    const oldRow = await payload.findByID({ collection: 'appointments', id: oldAppointment.id })
    expect(oldRow.status).toBe('cancelled')

    const newAppointments = await payload.find({
      collection: 'appointments',
      where: { confirmationCode: { equals: result.confirmation_code } },
      limit: 1,
    })
    const newRow = newAppointments.docs[0] as unknown as { status: string; accessTokenHash: string }
    expect(newRow.status).toBe('booked')
    expect(newRow.accessTokenHash).toBe(hashAccessToken(result.access_token))
  })

  it('REQUIRED: leaves the old appointment completely untouched when the new slot was taken before submit', async () => {
    const { slot: oldSlot, appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()
    // Simulates "the new slot was available at page load, but got taken by
    // someone else before this reschedule request was submitted": the slot
    // is already at capacity by the time handleReschedule runs.
    const takenSlot = await payload.create({
      collection: 'slots',
      data: {
        resource: resourceId,
        startsAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 86_400_000 + 1_800_000).toISOString(),
        capacity: 1,
        bookedCount: 1,
        status: 'open',
      },
    })

    const before = await payload.findByID({ collection: 'appointments', id: oldAppointment.id })

    await expect(
      handleReschedule(
        payload,
        {
          confirmation_code: oldAppointment.confirmationCode,
          access_token: oldAccessToken,
          new_slot_id: takenSlot.id,
          new_resource_id: resourceId,
          idempotency_key: newIdempotencyKey(),
        },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'SLOT_FULL' })

    // The original appointment must survive intact, unchanged — not
    // partially mutated, not cancelled, nothing.
    const after = await payload.findByID({ collection: 'appointments', id: oldAppointment.id })
    expect(after).toEqual(before)

    const unchangedOldSlot = await getSlot(payload, oldSlot.id)
    expect(unchangedOldSlot['bookedCount']).toBe(1)

    // No new appointment was created for this failed attempt.
    const newAppointments = await payload.find({
      collection: 'appointments',
      where: { confirmationCode: { equals: oldAppointment.confirmationCode } },
    })
    expect(newAppointments.totalDocs).toBe(1)
  })

  it('still reports success with old_appointment_cancelled:false when the old cancel fails after the new reserve succeeds', async () => {
    const { appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()
    const newSlot = await createSlot(payload, { resourceId, capacity: 1 })

    const cancelBookingModule = await import('../cancel-booking')
    const spy = vi
      .spyOn(cancelBookingModule, 'cancelBooking')
      .mockRejectedValueOnce(new Error('simulated cancel failure'))

    const result = await handleReschedule(
      payload,
      {
        confirmation_code: oldAppointment.confirmationCode,
        access_token: oldAccessToken,
        new_slot_id: newSlot.id,
        new_resource_id: resourceId,
        idempotency_key: newIdempotencyKey(),
      },
      NO_CUTOFF,
    )

    expect(result.old_appointment_cancelled).toBe(false)

    // The customer must never end up with zero appointments: both the new
    // one and the (uncancelled) old one still exist and are bookable.
    const newAppointments = await payload.find({
      collection: 'appointments',
      where: { confirmationCode: { equals: result.confirmation_code } },
      limit: 1,
    })
    expect((newAppointments.docs[0] as unknown as { status: string }).status).toBe('booked')

    const oldRow = await payload.findByID({ collection: 'appointments', id: oldAppointment.id })
    expect(oldRow.status).toBe('booked')

    spy.mockRestore()
  })

  it('rejects rescheduling past the cutoff with CUTOFF_PASSED and makes no writes', async () => {
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const { slot: oldSlot, appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment(soon)
    const newSlot = await createSlot(payload, { resourceId, capacity: 1 })
    const customersBefore = await payload.count({ collection: 'customers' })

    await expect(
      handleReschedule(
        payload,
        {
          confirmation_code: oldAppointment.confirmationCode,
          access_token: oldAccessToken,
          new_slot_id: newSlot.id,
          new_resource_id: resourceId,
          idempotency_key: newIdempotencyKey(),
        },
        24,
      ),
    ).rejects.toMatchObject({ code: 'CUTOFF_PASSED' })

    const oldRow = await payload.findByID({ collection: 'appointments', id: oldAppointment.id })
    expect(oldRow.status).toBe('booked')
    const unchangedOldSlot = await getSlot(payload, oldSlot.id)
    expect(unchangedOldSlot['bookedCount']).toBe(1)
    const unchangedNewSlot = await getSlot(payload, newSlot.id)
    expect(unchangedNewSlot['bookedCount']).toBe(0)
    const customersAfter = await payload.count({ collection: 'customers' })
    expect(customersAfter.totalDocs).toBe(customersBefore.totalDocs)
  })

  it.each(['done', 'no_show', 'cancelled'])(
    'rejects rescheduling a %s appointment with INVALID_INPUT',
    async (status) => {
      const { appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()
      await payload.update({ collection: 'appointments', id: oldAppointment.id, data: { status } })
      const newSlot = await createSlot(payload, { resourceId, capacity: 1 })

      await expect(
        handleReschedule(
          payload,
          {
            confirmation_code: oldAppointment.confirmationCode,
            access_token: oldAccessToken,
            new_slot_id: newSlot.id,
            new_resource_id: resourceId,
            idempotency_key: newIdempotencyKey(),
          },
          NO_CUTOFF,
        ),
      ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    },
  )

  it('rejects a wrong access_token with the generic NOT_FOUND error', async () => {
    const { appointment: oldAppointment } = await bookOldAppointment()
    const newSlot = await createSlot(payload, { resourceId, capacity: 1 })

    await expect(
      handleReschedule(
        payload,
        {
          confirmation_code: oldAppointment.confirmationCode,
          access_token: 'wrong-token',
          new_slot_id: newSlot.id,
          new_resource_id: resourceId,
          idempotency_key: newIdempotencyKey(),
        },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('rejects rescheduling to the same slot with INVALID_INPUT', async () => {
    const { slot: oldSlot, appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()

    await expect(
      handleReschedule(
        payload,
        {
          confirmation_code: oldAppointment.confirmationCode,
          access_token: oldAccessToken,
          new_slot_id: oldSlot.id,
          new_resource_id: resourceId,
          idempotency_key: newIdempotencyKey(),
        },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects rescheduling an appointment that is already mid-reschedule (claimed by another request), leaving the new slot untouched', async () => {
    const { appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()
    await payload.update({ collection: 'appointments', id: oldAppointment.id, data: { status: 'rescheduling' } })
    const newSlot = await createSlot(payload, { resourceId, capacity: 1 })

    await expect(
      handleReschedule(
        payload,
        {
          confirmation_code: oldAppointment.confirmationCode,
          access_token: oldAccessToken,
          new_slot_id: newSlot.id,
          new_resource_id: resourceId,
          idempotency_key: newIdempotencyKey(),
        },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })

    const unchangedNewSlot = await getSlot(payload, newSlot.id)
    expect(unchangedNewSlot['bookedCount']).toBe(0)
  })

  it('CONCURRENCY: two simultaneous reschedule requests for the same old appointment yield exactly one success, not two new appointments', async () => {
    const { appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()
    const slotA = await createSlot(payload, { resourceId, capacity: 1 })
    const slotB = await createSlot(payload, { resourceId, capacity: 1 })

    const results = await Promise.allSettled([
      handleReschedule(
        payload,
        {
          confirmation_code: oldAppointment.confirmationCode,
          access_token: oldAccessToken,
          new_slot_id: slotA.id,
          new_resource_id: resourceId,
          idempotency_key: newIdempotencyKey(),
        },
        NO_CUTOFF,
      ),
      handleReschedule(
        payload,
        {
          confirmation_code: oldAppointment.confirmationCode,
          access_token: oldAccessToken,
          new_slot_id: slotB.id,
          new_resource_id: resourceId,
          idempotency_key: newIdempotencyKey(),
        },
        NO_CUTOFF,
      ),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({ code: 'INVALID_INPUT' })

    const oldRow = await payload.findByID({ collection: 'appointments', id: oldAppointment.id })
    expect(oldRow.status).toBe('cancelled')

    // Exactly one of the two candidate slots was actually claimed — the
    // loser's slot must remain completely untouched, not double-booked.
    const [slotAAfter, slotBAfter] = await Promise.all([getSlot(payload, slotA.id), getSlot(payload, slotB.id)])
    expect([slotAAfter['bookedCount'], slotBAfter['bookedCount']].sort()).toEqual([0, 1])
  })

  it('is idempotent: retrying with the same idempotency_key returns the same new credentials without double-cancelling', async () => {
    const { appointment: oldAppointment, accessToken: oldAccessToken } = await bookOldAppointment()
    const newSlot = await createSlot(payload, { resourceId, capacity: 1 })
    const input = {
      confirmation_code: oldAppointment.confirmationCode,
      access_token: oldAccessToken,
      new_slot_id: newSlot.id,
      new_resource_id: resourceId,
      idempotency_key: newIdempotencyKey(),
    }

    const first = await handleReschedule(payload, input, NO_CUTOFF)
    const second = await handleReschedule(payload, input, NO_CUTOFF)

    expect(second.confirmation_code).toBe(first.confirmation_code)
    expect(second.access_token).toBe(first.access_token)
    expect(second.link_token).toBe(first.link_token)

    const updatedNewSlot = await getSlot(payload, newSlot.id)
    expect(updatedNewSlot['bookedCount']).toBe(1)
  })
})
