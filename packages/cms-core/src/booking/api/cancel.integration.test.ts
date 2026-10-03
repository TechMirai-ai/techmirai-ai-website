import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { handleCancel } from './cancel'
import { CODE_OR_TOKEN_ERROR_MESSAGE } from './entities'
import { deriveAccessToken } from './tokens'
import { createCustomer, createResource, createService, createSlot, getSlot } from '../test/factories'
import { getTestPayload } from '../test/payload'

let payload: Payload
let resourceId: number | string
let serviceId: number | string
let customerId: number | string

// Every appointment booked in this suite via bookAppointment() defaults to a
// slot ~1 day out (see createSlot's default startsAt), so a 0-hour cutoff
// never actually restricts anything here — existing tests care about
// status/token behaviour, not the cutoff, which is exercised separately
// below with a slot deliberately scheduled inside the cutoff window.
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

async function bookAppointment(startsAt?: string) {
  const slot = await createSlot(payload, { resourceId, capacity: 1, ...(startsAt ? { startsAt } : {}) })
  const idempotencyKey = `key-${Math.random().toString(36).slice(2)}`
  const accessToken = deriveAccessToken(idempotencyKey)
  const { createBooking } = await import('../create-booking')
  const { hashAccessToken } = await import('./tokens')
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

describe('handleCancel', () => {
  it('cancels a booked appointment and releases the slot capacity', async () => {
    const { slot, appointment, accessToken } = await bookAppointment()

    const result = await handleCancel(
      payload,
      { confirmation_code: appointment.confirmationCode, access_token: accessToken },
      NO_CUTOFF,
    )

    expect(result).toEqual({ status: 'cancelled', already_cancelled: false })

    const updatedSlot = await getSlot(payload, slot.id)
    expect(updatedSlot['bookedCount']).toBe(0)
  })

  it('is idempotent: cancelling twice is not an error', async () => {
    const { appointment, accessToken } = await bookAppointment()
    const request = { confirmation_code: appointment.confirmationCode, access_token: accessToken }

    const first = await handleCancel(payload, request, NO_CUTOFF)
    const second = await handleCancel(payload, request, NO_CUTOFF)

    expect(first).toEqual({ status: 'cancelled', already_cancelled: false })
    expect(second).toEqual({ status: 'cancelled', already_cancelled: true })
  })

  it('rejects a wrong access_token with a generic NOT_FOUND error', async () => {
    const { appointment } = await bookAppointment()

    await expect(
      handleCancel(
        payload,
        { confirmation_code: appointment.confirmationCode, access_token: 'wrong-token' },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })

  it('rejects a nonexistent confirmation_code with the identical generic NOT_FOUND error', async () => {
    await expect(
      handleCancel(payload, { confirmation_code: 'DOES-NOT-EXIST', access_token: 'any-token' }, NO_CUTOFF),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })

  it('rejects cancelling an appointment that has already been completed (done)', async () => {
    const { appointment, accessToken } = await bookAppointment()
    await payload.update({ collection: 'appointments', id: appointment.id, data: { status: 'done' } })

    await expect(
      handleCancel(
        payload,
        { confirmation_code: appointment.confirmationCode, access_token: accessToken },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })

    const unchanged = await payload.findByID({ collection: 'appointments', id: appointment.id })
    expect(unchanged.status).toBe('done')
  })

  it('rejects cancelling a no-show appointment', async () => {
    const { appointment, accessToken } = await bookAppointment()
    await payload.update({ collection: 'appointments', id: appointment.id, data: { status: 'no_show' } })

    await expect(
      handleCancel(
        payload,
        { confirmation_code: appointment.confirmationCode, access_token: accessToken },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('still allows cancelling a confirmed or checked-in appointment (not yet completed)', async () => {
    const { appointment, accessToken } = await bookAppointment()
    await payload.update({ collection: 'appointments', id: appointment.id, data: { status: 'checked_in' } })

    const result = await handleCancel(
      payload,
      { confirmation_code: appointment.confirmationCode, access_token: accessToken },
      NO_CUTOFF,
    )

    expect(result).toEqual({ status: 'cancelled', already_cancelled: false })
  })

  it('rejects cancelling past the configured cutoff with CUTOFF_PASSED, leaving the appointment untouched', async () => {
    // 1 hour out, well inside a 24h cutoff.
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const { slot, appointment, accessToken } = await bookAppointment(soon)

    await expect(
      handleCancel(
        payload,
        { confirmation_code: appointment.confirmationCode, access_token: accessToken },
        24,
      ),
    ).rejects.toMatchObject({ code: 'CUTOFF_PASSED' })

    const unchanged = await payload.findByID({ collection: 'appointments', id: appointment.id })
    expect(unchanged.status).toBe('booked')
    const unchangedSlot = await getSlot(payload, slot.id)
    expect(unchangedSlot['bookedCount']).toBe(1)
  })

  it('still succeeds (already_cancelled: true) when retrying a cancel on an already-cancelled appointment, even past the cutoff', async () => {
    // Regression: a retried cancel of an already-cancelled appointment must
    // stay idempotent regardless of the cutoff — the cutoff protects the
    // clinic from a NEW last-minute cancellation, not from a harmless
    // no-op retry of one that already happened.
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const { appointment, accessToken } = await bookAppointment(soon)
    await payload.update({ collection: 'appointments', id: appointment.id, data: { status: 'cancelled' } })

    const result = await handleCancel(
      payload,
      { confirmation_code: appointment.confirmationCode, access_token: accessToken },
      24,
    )

    expect(result).toEqual({ status: 'cancelled', already_cancelled: true })
  })

  it('rejects cancelling an appointment that is mid-reschedule', async () => {
    const { appointment, accessToken } = await bookAppointment()
    await payload.update({ collection: 'appointments', id: appointment.id, data: { status: 'rescheduling' } })

    await expect(
      handleCancel(
        payload,
        { confirmation_code: appointment.confirmationCode, access_token: accessToken },
        NO_CUTOFF,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('still allows cancelling exactly at the cutoff boundary', async () => {
    const exactlyAtCutoff = new Date(Date.now() + 24 * 60 * 60 * 1000 + 5000).toISOString()
    const { appointment, accessToken } = await bookAppointment(exactlyAtCutoff)

    const result = await handleCancel(
      payload,
      { confirmation_code: appointment.confirmationCode, access_token: accessToken },
      24,
    )

    expect(result).toEqual({ status: 'cancelled', already_cancelled: false })
  })
})
