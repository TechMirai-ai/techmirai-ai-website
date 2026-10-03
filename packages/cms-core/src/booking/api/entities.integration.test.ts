import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { createBooking } from '../create-booking'
import { createCustomer, createResource, createService, createSlot } from '../test/factories'
import { getTestPayload } from '../test/payload'
import { CODE_OR_TOKEN_ERROR_MESSAGE, verifyAppointmentAccess } from './entities'
import { deriveAccessToken, deriveLinkToken, hashAccessToken } from './tokens'

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

afterEach(() => {
  vi.unstubAllEnvs()
})

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

interface BookOptions {
  /** Omit to skip generating a manage-link credential entirely (simulates an appointment predating this feature). */
  withLinkToken?: boolean
  linkTokenExpiresAt?: string
}

async function bookAppointment(options: BookOptions = {}) {
  const slot = await createSlot(payload, { resourceId, capacity: 1 })
  const idempotencyKey = `key-${Math.random().toString(36).slice(2)}`
  const accessToken = deriveAccessToken(idempotencyKey)
  const linkToken = deriveLinkToken(idempotencyKey)

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

  const withLinkToken = options.withLinkToken ?? true
  if (withLinkToken) {
    await payload.update({
      collection: 'appointments',
      id: appointment.id,
      data: {
        manageLinkTokenHash: hashAccessToken(linkToken),
        manageLinkTokenExpiresAt: options.linkTokenExpiresAt ?? new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
      },
    })
  }

  return { appointment, accessToken, linkToken }
}

describe('verifyAppointmentAccess', () => {
  it('succeeds with the correct access_token', async () => {
    const { appointment, accessToken } = await bookAppointment()
    const result = await verifyAppointmentAccess(payload, appointment.confirmationCode, accessToken)
    expect(result.id).toBe(appointment.id)
  })

  it('succeeds with the correct, unexpired linkToken', async () => {
    const { appointment, linkToken } = await bookAppointment()
    const result = await verifyAppointmentAccess(payload, appointment.confirmationCode, linkToken)
    expect(result.id).toBe(appointment.id)
  })

  it('rejects an expired linkToken with the generic NOT_FOUND error, even though the hash matches', async () => {
    const past = new Date(Date.now() - 1000).toISOString()
    const { appointment, linkToken } = await bookAppointment({ linkTokenExpiresAt: past })

    await expect(
      verifyAppointmentAccess(payload, appointment.confirmationCode, linkToken),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })

  it('rejects a wrong token when both access_token and linkToken hashes are set', async () => {
    const { appointment } = await bookAppointment()

    await expect(
      verifyAppointmentAccess(payload, appointment.confirmationCode, 'wrong-token'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })

  it('still verifies access_token when manageLinkTokenHash was never generated (pre-existing appointment)', async () => {
    const { appointment, accessToken } = await bookAppointment({ withLinkToken: false })

    const result = await verifyAppointmentAccess(payload, appointment.confirmationCode, accessToken)
    expect(result.id).toBe(appointment.id)
  })

  it('rejects any token without crashing when manageLinkTokenHash is null', async () => {
    const { appointment } = await bookAppointment({ withLinkToken: false })

    await expect(
      verifyAppointmentAccess(payload, appointment.confirmationCode, 'some-guessed-link-token'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })

  it('rejects a nonexistent confirmation_code with the identical generic NOT_FOUND error', async () => {
    await expect(
      verifyAppointmentAccess(payload, 'DOES-NOT-EXIST', 'any-token'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: CODE_OR_TOKEN_ERROR_MESSAGE })
  })
})
