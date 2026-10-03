import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { handleCancel } from './cancel'
import { CODE_OR_TOKEN_ERROR_MESSAGE } from './entities'
import { handleLineManageLookup } from './line-manage-lookup'
import { deriveAccessToken, hashAccessToken } from './tokens'
import { createCustomer, createResource, createService, createSlot } from '../test/factories'
import { createBooking } from '../create-booking'
import { getTestPayload } from '../test/payload'

let payload: Payload
let resourceId: number | string
let serviceId: number | string

const NO_CUTOFF = 0

beforeAll(async () => {
  payload = await getTestPayload()
  resourceId = (await createResource(payload)).id
  serviceId = (await createService(payload)).id
})

beforeEach(() => {
  vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
})

async function bookForCustomer(customerId: number | string, startsAt: string) {
  // createSlot's default endsAt is NOT computed relative to a custom
  // startsAt — it must be passed explicitly whenever startsAt is
  // overridden, or the slots_ends_after_starts CHECK constraint can be
  // violated (see booking-notifications.integration.test.ts's identical note).
  const endsAt = new Date(new Date(startsAt).getTime() + 30 * 60_000).toISOString()
  const slot = await createSlot(payload, { resourceId, capacity: 1, startsAt, endsAt })
  const idempotencyKey = `line-manage-${Math.random().toString(36).slice(2)}`
  const accessToken = deriveAccessToken(idempotencyKey)
  const { appointment } = await createBooking(payload, {
    slotId: slot.id,
    customerId,
    serviceId,
    visitType: 'first',
    scheduledAt: startsAt,
    idempotencyKey,
    accessTokenHash: hashAccessToken(accessToken),
    source: 'web',
  })
  return { appointment, accessToken }
}

describe('handleLineManageLookup (integration)', () => {
  it('returns matched: false, doing no appointment lookup at all, for a LINE user id with no linked customer', async () => {
    const result = await handleLineManageLookup(payload, 'Uintegration-unmatched-00000000001', 'ja')
    expect(result).toEqual({ matched: false })
  })

  it('returns the correct upcoming appointments — SCOPED ONLY to this customer, not any other', async () => {
    const lineUserId = `Uintegration-${Math.random().toString(36).slice(2)}`
    const customer = await createCustomer(payload, { lineUserId })
    const otherCustomer = await createCustomer(payload)

    const future1 = new Date(Date.now() + 24 * 60 * 60_000).toISOString()
    const future2 = new Date(Date.now() + 48 * 60 * 60_000).toISOString()
    const { appointment: mine1 } = await bookForCustomer(customer.id, future1)
    const { appointment: mine2 } = await bookForCustomer(customer.id, future2)
    // Someone else's upcoming appointment — must never appear in this
    // customer's list, regardless of how the query is written.
    await bookForCustomer(otherCustomer.id, future1)

    const result = await handleLineManageLookup(payload, lineUserId, 'ja')

    expect(result.matched).toBe(true)
    if (result.matched) {
      const codes = result.appointments.map((a) => a.confirmation_code)
      expect(codes.sort()).toEqual([mine1.confirmationCode, mine2.confirmationCode].sort())
    }
  })

  it("the returned access_token actually authorizes cancelling THAT SPECIFIC appointment via the real, unmodified /cancel endpoint", async () => {
    const lineUserId = `Uintegration-${Math.random().toString(36).slice(2)}`
    const customer = await createCustomer(payload, { lineUserId })
    const future = new Date(Date.now() + 24 * 60 * 60_000).toISOString()
    await bookForCustomer(customer.id, future)

    const lookup = await handleLineManageLookup(payload, lineUserId, 'ja')
    expect(lookup.matched).toBe(true)
    if (!lookup.matched) return
    const [mine] = lookup.appointments
    expect(mine).toBeDefined()

    const result = await handleCancel(
      payload,
      { confirmation_code: mine!.confirmation_code, access_token: mine!.access_token },
      NO_CUTOFF,
    )
    expect(result).toEqual({ status: 'cancelled', already_cancelled: false })
  })

  it('OWNERSHIP REJECTION: a token derived for one appointment does not authorize acting on a DIFFERENT appointment, even one belonging to the same customer', async () => {
    const lineUserId = `Uintegration-${Math.random().toString(36).slice(2)}`
    const customer = await createCustomer(payload, { lineUserId })
    const future1 = new Date(Date.now() + 24 * 60 * 60_000).toISOString()
    const future2 = new Date(Date.now() + 48 * 60 * 60_000).toISOString()
    const { appointment: appointmentA, accessToken: tokenA } = await bookForCustomer(customer.id, future1)
    const { appointment: appointmentB } = await bookForCustomer(customer.id, future2)

    // appointment A's own real, correctly-derived token — used against
    // appointment B's confirmation code. This is exactly the shape of bug a
    // broken customer-scoped query (or a tampered client request) could
    // produce, and the SEPARATE, unmodified /cancel endpoint must still
    // reject it via its own independent token-to-appointment verification.
    await expect(
      handleCancel(payload, { confirmation_code: appointmentB.confirmationCode, access_token: tokenA }, NO_CUTOFF),
    ).rejects.toThrow(CODE_OR_TOKEN_ERROR_MESSAGE)

    // Sanity: appointment A's own token against its OWN code still works.
    const result = await handleCancel(
      payload,
      { confirmation_code: appointmentA.confirmationCode, access_token: tokenA },
      NO_CUTOFF,
    )
    expect(result).toEqual({ status: 'cancelled', already_cancelled: false })
  })

  it("OWNERSHIP REJECTION: another customer's own real access_token does not authorize this customer's appointment", async () => {
    const lineUserId = `Uintegration-${Math.random().toString(36).slice(2)}`
    const customer = await createCustomer(payload, { lineUserId })
    const otherCustomer = await createCustomer(payload)
    const future = new Date(Date.now() + 24 * 60 * 60_000).toISOString()

    const { appointment: mine } = await bookForCustomer(customer.id, future)
    const { accessToken: otherToken } = await bookForCustomer(otherCustomer.id, future)

    await expect(
      handleCancel(payload, { confirmation_code: mine.confirmationCode, access_token: otherToken }, NO_CUTOFF),
    ).rejects.toThrow(CODE_OR_TOKEN_ERROR_MESSAGE)
  })

  it('excludes a past-scheduled appointment from the list', async () => {
    const lineUserId = `Uintegration-${Math.random().toString(36).slice(2)}`
    const customer = await createCustomer(payload, { lineUserId })
    const past = new Date(Date.now() - 24 * 60 * 60_000).toISOString()
    await bookForCustomer(customer.id, past)

    const result = await handleLineManageLookup(payload, lineUserId, 'ja')
    expect(result).toEqual({ matched: true, appointments: [] })
  })

  it('excludes an already-cancelled appointment from the list', async () => {
    const lineUserId = `Uintegration-${Math.random().toString(36).slice(2)}`
    const customer = await createCustomer(payload, { lineUserId })
    const future = new Date(Date.now() + 24 * 60 * 60_000).toISOString()
    const { appointment, accessToken } = await bookForCustomer(customer.id, future)
    await handleCancel(payload, { confirmation_code: appointment.confirmationCode, access_token: accessToken }, NO_CUTOFF)

    const result = await handleLineManageLookup(payload, lineUserId, 'ja')
    expect(result).toEqual({ matched: true, appointments: [] })
  })
})
