import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { handleLookup } from './lookup'
import { CODE_OR_TOKEN_ERROR_MESSAGE } from './entities'
import { deriveAccessToken, hashAccessToken } from './tokens'
import { createCustomer, createResource, createService, createSlot } from '../test/factories'
import { getTestPayload } from '../test/payload'

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

beforeEach(() => {
  vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
})

async function bookAppointment() {
  const slot = await createSlot(payload, { resourceId, capacity: 1 })
  const idempotencyKey = `key-${Math.random().toString(36).slice(2)}`
  const accessToken = deriveAccessToken(idempotencyKey)
  const { createBooking } = await import('../create-booking')
  const { appointment } = await createBooking(payload, {
    slotId: slot.id,
    customerId,
    serviceId,
    visitType: 'return',
    scheduledAt: slot['startsAt'] as string,
    idempotencyKey,
    accessTokenHash: hashAccessToken(accessToken),
    source: 'web',
  })
  return { slot, appointment, accessToken }
}

describe('handleLookup', () => {
  it('returns the appointment for a matching code and token', async () => {
    const { slot, appointment, accessToken } = await bookAppointment()

    const result = await handleLookup(payload, { code: appointment.confirmationCode, token: accessToken })

    expect(result).toEqual({
      confirmation_code: appointment.confirmationCode,
      status: 'booked',
      visit_type: 'return',
      scheduled_at: slot['startsAt'],
      service_id: serviceId,
      resource_id: resourceId,
    })
  })

  it('rejects a wrong token with a generic NOT_FOUND error', async () => {
    const { appointment } = await bookAppointment()

    await expect(
      handleLookup(payload, { code: appointment.confirmationCode, token: 'wrong-token' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })

  it('rejects a nonexistent code with the byte-identical generic NOT_FOUND error', async () => {
    let wrongTokenError: unknown
    let missingCodeError: unknown
    const { appointment } = await bookAppointment()

    try {
      await handleLookup(payload, { code: appointment.confirmationCode, token: 'wrong-token' })
    } catch (err) {
      wrongTokenError = err
    }
    try {
      await handleLookup(payload, { code: 'DOES-NOT-EXIST', token: 'wrong-token' })
    } catch (err) {
      missingCodeError = err
    }

    expect(wrongTokenError).toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
    expect(missingCodeError).toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })

  it('never returns another appointment’s data for a mismatched token', async () => {
    const first = await bookAppointment()
    const second = await bookAppointment()

    await expect(
      handleLookup(payload, { code: first.appointment.confirmationCode, token: second.accessToken }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('does the same number of DB round-trips whether the code exists (wrong token) or not — no I/O timing oracle', async () => {
    // Crypto-timing-safety alone isn't enough: a real timing side-channel is
    // dominated by I/O, not CPU. If the "code exists" path does one extra DB
    // round-trip (e.g. resolving the slot) that the "code doesn't exist" path
    // skips, that round-trip IS a measurable, exploitable timing oracle even
    // though verifyAccessToken/dummyVerify are perfectly timing-safe.
    const { appointment } = await bookAppointment()

    const findSpy = vi.spyOn(payload, 'find')
    const findByIdSpy = vi.spyOn(payload, 'findByID')

    await expect(
      handleLookup(payload, { code: appointment.confirmationCode, token: 'wrong-token' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    const wrongTokenQueryCount = findSpy.mock.calls.length + findByIdSpy.mock.calls.length

    findSpy.mockClear()
    findByIdSpy.mockClear()

    await expect(
      handleLookup(payload, { code: 'DOES-NOT-EXIST', token: 'wrong-token' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    const missingCodeQueryCount = findSpy.mock.calls.length + findByIdSpy.mock.calls.length

    expect(wrongTokenQueryCount).toBe(missingCodeQueryCount)

    findSpy.mockRestore()
    findByIdSpy.mockRestore()
  })

  it('returns the identical generic NOT_FOUND — not a crash — for an appointment with no access token on file', async () => {
    // accessTokenHash is optional on the appointments collection (walk-in /
    // phone bookings created outside /reserve may have none). Any code+token
    // lookup against such an appointment must still degrade to the same
    // generic NOT_FOUND, not an uncaught error that would itself leak "this
    // code exists" via a different (500) response shape.
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    const { createBooking } = await import('../create-booking')
    const { appointment } = await createBooking(payload, {
      slotId: slot.id,
      customerId,
      serviceId,
      visitType: 'first',
      scheduledAt: slot['startsAt'] as string,
      idempotencyKey: `key-${Math.random().toString(36).slice(2)}`,
      accessTokenHash: null,
      source: 'phone',
    })

    await expect(
      handleLookup(payload, { code: appointment.confirmationCode, token: 'any-token' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })
})
