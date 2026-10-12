import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { handleReserve } from './reserve'
import { hashAccessToken } from './tokens'
import { createResource, createService, createSlot, getSlot } from '../test/factories'
import { getTestPayload } from '../test/payload'
import type { ReserveRequest } from './schemas'

let payload: Payload
let resourceId: number | string
let otherResourceId: number | string
let serviceId: number | string

const customerName = {
  family_name: '山田',
  given_name: '太郎',
  family_name_kana: 'ヤマダ',
  given_name_kana: 'タロウ',
}

/**
 * A fresh phone per call — most tests in this file don't care about
 * customer dedup and must not accidentally collide with each other now
 * that handleReserve reuses an existing customer row by phone (STEP 2
 * Part 2 item 5). Tests that specifically exercise dedup pass an explicit,
 * deliberately-repeated phone via overrides.customer.
 */
function uniquePhone(): string {
  return `090-${Math.random().toString().slice(2, 6)}-${Math.random().toString().slice(2, 6)}`
}

function reserveInput(overrides: Partial<ReserveRequest> = {}): ReserveRequest {
  return {
    service_id: serviceId,
    resource_id: resourceId,
    slot_id: overrides.slot_id ?? 0,
    visit_type: 'first',
    customer: { ...customerName, phone: uniquePhone() },
    locale: 'ja',
    idempotency_key: `key-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  }
}

beforeAll(async () => {
  payload = await getTestPayload()
  resourceId = (await createResource(payload)).id
  otherResourceId = (await createResource(payload, { name: '診察室C' })).id
  serviceId = (await createService(payload)).id
})

beforeEach(() => {
  vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
})

describe('handleReserve', () => {
  it('reserves an open slot and returns a confirmation code and access token', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    const result = await handleReserve(payload, reserveInput({ slot_id: slot.id }))

    expect(result.confirmation_code).toEqual(expect.any(String))
    expect(result.access_token).toEqual(expect.any(String))

    const updatedSlot = await getSlot(payload, slot.id)
    expect(updatedSlot['bookedCount']).toBe(1)
  })

  it('stores the company, and accepts an English booking with no kana (Spec 12.4)', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    const phone = uniquePhone()

    const result = await handleReserve(
      payload,
      reserveInput({
        slot_id: slot.id,
        locale: 'en',
        customer: { family_name: 'Smith', given_name: 'Alex', phone, company: 'Acme Co.' },
      }),
    )

    expect(result.confirmation_code).toEqual(expect.any(String))
    const customers = await payload.find({ collection: 'customers', where: { phone: { equals: phone } }, limit: 1 })
    expect(customers.docs[0]).toMatchObject({ company: 'Acme Co.', locale: 'en' })
  })

  it('returns an access token that authenticates against the stored hash', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    const result = await handleReserve(payload, reserveInput({ slot_id: slot.id }))

    const appointments = await payload.find({
      collection: 'appointments',
      where: { confirmationCode: { equals: result.confirmation_code } },
      limit: 1,
    })
    const appointment = appointments.docs[0] as unknown as { accessTokenHash: string }
    expect(appointment.accessTokenHash).toBe(hashAccessToken(result.access_token))
  })

  it('returns a link_token that authenticates against the stored hash and has a future expiry', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    const result = await handleReserve(payload, reserveInput({ slot_id: slot.id }))
    expect(result.link_token).toEqual(expect.any(String))
    expect(result.link_token).not.toBe(result.access_token)

    const appointments = await payload.find({
      collection: 'appointments',
      where: { confirmationCode: { equals: result.confirmation_code } },
      limit: 1,
    })
    const appointment = appointments.docs[0] as unknown as {
      manageLinkTokenHash: string
      manageLinkTokenExpiresAt: string
    }
    expect(appointment.manageLinkTokenHash).toBe(hashAccessToken(result.link_token))
    expect(new Date(appointment.manageLinkTokenExpiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('creates a new customer record for the reservation', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    const before = await payload.count({ collection: 'customers' })

    await handleReserve(payload, reserveInput({ slot_id: slot.id }))

    const after = await payload.count({ collection: 'customers' })
    expect(after.totalDocs).toBe(before.totalDocs + 1)
  })

  describe('customer phone-uniqueness + lineUserId (STEP 2 Part 2 item 5)', () => {
    it('own repeat booking with the SAME phone and no LINE session succeeds each time, WITHOUT reusing the existing customer row', async () => {
      // See the SECURITY tests below for why: a bare phone match is not
      // proof of identity, so this deliberately does NOT dedup the way an
      // earlier version of this code did. A duplicate contact record
      // (staff-mergeable via /admin) is the accepted, safer cost.
      const phone = uniquePhone()
      const customer = { ...customerName, phone }
      const slotA = await createSlot(payload, { resourceId, capacity: 1 })
      const slotB = await createSlot(payload, { resourceId, capacity: 1 })
      const before = await payload.count({ collection: 'customers' })

      const first = await handleReserve(payload, reserveInput({ slot_id: slotA.id, customer }))
      const second = await handleReserve(payload, reserveInput({ slot_id: slotB.id, customer }))

      expect(second.confirmation_code).not.toBe(first.confirmation_code)

      const after = await payload.count({ collection: 'customers' })
      expect(after.totalDocs).toBe(before.totalDocs + 2)

      const appointments = await payload.find({
        collection: 'appointments',
        where: { confirmationCode: { in: [first.confirmation_code, second.confirmation_code] } },
        depth: 0, // raw customer IDs, not populated documents — see entities.ts's own convention
      })
      const customerIds = appointments.docs.map((a) => String((a as unknown as { customer: unknown }).customer))
      expect(new Set(customerIds).size).toBe(2)
    })

    it('own repeat booking under the SAME verified lineUserId succeeds and reuses the existing customer', async () => {
      const phone = uniquePhone()
      const customer = { ...customerName, phone }
      const lineUserId = 'Uresolve0000000000000000000001'
      const slotA = await createSlot(payload, { resourceId, capacity: 1 })
      const slotB = await createSlot(payload, { resourceId, capacity: 1 })
      const before = await payload.count({ collection: 'customers' })

      await handleReserve(payload, reserveInput({ slot_id: slotA.id, customer }), lineUserId)
      await handleReserve(payload, reserveInput({ slot_id: slotB.id, customer }), lineUserId)

      const after = await payload.count({ collection: 'customers' })
      expect(after.totalDocs).toBe(before.totalDocs + 1)
    })

    it('SECURITY: does not inject a booking onto a stranger\'s existing unlinked customer record just because the phone matches, LINE session or not', async () => {
      // The core vulnerability class (found by code review, then sharpened
      // by a follow-up security review): reusing an existing customer row
      // on a bare phone match — regardless of whether the new request
      // carries a LINE session — lets an unrelated caller get a REAL
      // APPOINTMENT created against a stranger's existing patient record
      // ("booking injection"), not just a mis-attached lineUserId. Fixed
      // by never reusing an unlinked existing row for a NEW booking; a
      // second, separate customer is created instead.
      const phone = uniquePhone()
      const victimName = { family_name: '被害者', given_name: '花子', family_name_kana: 'ヒガイシャ', given_name_kana: 'ハナコ' }
      const attackerName = { family_name: '攻撃者', given_name: '太郎', family_name_kana: 'コウゲキシャ', given_name_kana: 'タロウ' }
      const lineUserId = 'Uresolve0000000000000000000002'
      const slotA = await createSlot(payload, { resourceId, capacity: 1 })
      const slotB = await createSlot(payload, { resourceId, capacity: 1 })
      const before = await payload.count({ collection: 'customers' })

      // The victim books first, anonymously — no LINE link.
      await handleReserve(payload, reserveInput({ slot_id: slotA.id, customer: { ...victimName, phone } }))
      const victim = (
        await payload.find({ collection: 'customers', where: { phone: { equals: phone } } })
      ).docs[0] as unknown as { id: string | number; lineUserId: string | null }
      expect(victim.lineUserId ?? null).toBeNull()

      // The attacker, under a real verified LINE session, submits the
      // SAME phone number with a DIFFERENT name.
      const second = await handleReserve(
        payload,
        reserveInput({ slot_id: slotB.id, customer: { ...attackerName, phone } }),
        lineUserId,
      )

      // A second, separate customer was created — the victim's record is
      // untouched (still unlinked) and the attacker's appointment is
      // attributed to their OWN new row, never the victim's.
      const after = await payload.count({ collection: 'customers' })
      expect(after.totalDocs).toBe(before.totalDocs + 2)

      const victimAfter = await payload.findByID({ collection: 'customers', id: victim.id })
      expect((victimAfter as unknown as { lineUserId: string | null }).lineUserId ?? null).toBeNull()

      const attackerAppointment = (
        await payload.find({
          collection: 'appointments',
          where: { confirmationCode: { equals: second.confirmation_code } },
          depth: 0, // raw customer ID, not a populated document
        })
      ).docs[0] as unknown as { customer: unknown }
      expect(String(attackerAppointment.customer)).not.toBe(String(victim.id))
    })

    it('rejects with PHONE_ALREADY_REGISTERED when the phone belongs to a customer linked to a DIFFERENT lineUserId', async () => {
      const phone = uniquePhone()
      const customer = { ...customerName, phone }
      const slotA = await createSlot(payload, { resourceId, capacity: 1 })
      const slotB = await createSlot(payload, { resourceId, capacity: 1 })
      const before = await payload.count({ collection: 'customers' })

      await handleReserve(payload, reserveInput({ slot_id: slotA.id, customer }), 'Uresolve0000000000000000000003')

      await expect(
        handleReserve(payload, reserveInput({ slot_id: slotB.id, customer }), 'UresolveDIFFERENT00000000000004'),
      ).rejects.toMatchObject({ code: 'PHONE_ALREADY_REGISTERED' })

      // No orphaned customer created by the rejected attempt.
      const after = await payload.count({ collection: 'customers' })
      expect(after.totalDocs).toBe(before.totalDocs + 1)
      const updatedSlotB = await getSlot(payload, slotB.id)
      expect(updatedSlotB['bookedCount']).toBe(0)
    })

    it('rejects an anonymous (no LINE session) booking whose phone matches a customer already linked to SOME lineUserId', async () => {
      const phone = uniquePhone()
      const customer = { ...customerName, phone }
      const slotA = await createSlot(payload, { resourceId, capacity: 1 })
      const slotB = await createSlot(payload, { resourceId, capacity: 1 })

      await handleReserve(payload, reserveInput({ slot_id: slotA.id, customer }), 'Uresolve0000000000000000000005')

      await expect(
        handleReserve(payload, reserveInput({ slot_id: slotB.id, customer })),
      ).rejects.toMatchObject({ code: 'PHONE_ALREADY_REGISTERED' })
    })

    it('resolves an already-linked LINE account by lineUserId directly, even when a different phone is submitted — never a duplicate-lineUserId write', async () => {
      // If resolveCustomer only ever matched by phone, a second booking
      // under the SAME LINE account but a DIFFERENT phone (e.g. the
      // returning-patient shortcut re-submits whatever phone happens to be
      // in the form) would try to attach this lineUserId to a brand-new
      // customer row too, violating the unique index on customers.lineUserId.
      const lineUserId = 'Uresolve0000000000000000000006'
      const firstPhone = uniquePhone()
      const secondPhone = uniquePhone()
      const slotA = await createSlot(payload, { resourceId, capacity: 1 })
      const slotB = await createSlot(payload, { resourceId, capacity: 1 })
      const before = await payload.count({ collection: 'customers' })

      await handleReserve(
        payload,
        reserveInput({ slot_id: slotA.id, customer: { ...customerName, phone: firstPhone } }),
        lineUserId,
      )

      await expect(
        handleReserve(
          payload,
          reserveInput({ slot_id: slotB.id, customer: { ...customerName, phone: secondPhone } }),
          lineUserId,
        ),
      ).resolves.toBeDefined()

      const after = await payload.count({ collection: 'customers' })
      expect(after.totalDocs).toBe(before.totalDocs + 1)
    })
  })

  it('rejects a filled honeypot field with INVALID_INPUT and makes no booking', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })

    await expect(
      handleReserve(payload, reserveInput({ slot_id: slot.id, _hp: 'i-am-a-bot' })),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })

    const updatedSlot = await getSlot(payload, slot.id)
    expect(updatedSlot['bookedCount']).toBe(0)
  })

  it('rejects a nonexistent service_id with INVALID_INPUT', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    await expect(
      handleReserve(payload, reserveInput({ slot_id: slot.id, service_id: 999_999_999 })),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects a nonexistent resource_id with INVALID_INPUT', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    await expect(
      handleReserve(payload, reserveInput({ slot_id: slot.id, resource_id: 999_999_999 })),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects a slot that does not belong to resource_id with INVALID_INPUT', async () => {
    const slot = await createSlot(payload, { resourceId: otherResourceId, capacity: 1 })
    await expect(
      handleReserve(payload, reserveInput({ slot_id: slot.id, resource_id: resourceId })),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  it('rejects a blocked slot with SLOT_CLOSED', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1, status: 'blocked' })
    await expect(
      handleReserve(payload, reserveInput({ slot_id: slot.id })),
    ).rejects.toMatchObject({ code: 'SLOT_CLOSED' })
  })

  it('rejects a closed slot with SLOT_CLOSED', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1, status: 'closed' })
    await expect(
      handleReserve(payload, reserveInput({ slot_id: slot.id })),
    ).rejects.toMatchObject({ code: 'SLOT_CLOSED' })
  })

  it('rejects a full slot with SLOT_FULL', async () => {
    const slot = await payload.create({
      collection: 'slots',
      data: {
        resource: resourceId,
        startsAt: new Date(Date.now() + 86_400_000).toISOString(),
        endsAt: new Date(Date.now() + 86_400_000 + 1_800_000).toISOString(),
        capacity: 1,
        bookedCount: 1,
        status: 'open',
      },
    })

    await expect(
      handleReserve(payload, reserveInput({ slot_id: slot.id })),
    ).rejects.toMatchObject({ code: 'SLOT_FULL' })
  })

  it('does not leave an orphan customer row when a concurrent request loses the capacity race', async () => {
    // Distinct from the idempotency-retry case above: these are 10 genuinely
    // different requests (different idempotency_key each) racing for a
    // capacity-1 slot. assertSlotBookable's pre-check can pass for more than
    // one of them before any commits, so the losers reach createBooking's
    // atomic claim and get SlotUnavailableError — at that point they must not
    // have already left behind a customers row nobody will ever reference.
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    const before = await payload.count({ collection: 'customers' })

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => handleReserve(payload, reserveInput({ slot_id: slot.id }))),
    )

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    expect(fulfilled).toHaveLength(1)

    const after = await payload.count({ collection: 'customers' })
    expect(after.totalDocs).toBe(before.totalDocs + 1)
  })

  it('cleans up the orphaned customer row on any reservation failure, not just SlotUnavailableError', async () => {
    // The previous fix (above) only cleaned up on SlotUnavailableError. Any
    // OTHER error out of createBooking — a DB constraint violation, a
    // connection failure — must not leave the same orphaned PII behind.
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    const before = await payload.count({ collection: 'customers' })

    const createBookingModule = await import('../create-booking')
    const spy = vi
      .spyOn(createBookingModule, 'createBooking')
      .mockRejectedValueOnce(new Error('simulated unexpected failure'))

    await expect(handleReserve(payload, reserveInput({ slot_id: slot.id }))).rejects.toThrow(
      'simulated unexpected failure',
    )

    const after = await payload.count({ collection: 'customers' })
    expect(after.totalDocs).toBe(before.totalDocs)

    spy.mockRestore()
  })

  it('is idempotent: retrying with the same idempotency_key returns the same confirmation and token without double-booking', async () => {
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    const input = reserveInput({ slot_id: slot.id })

    const first = await handleReserve(payload, input)
    const second = await handleReserve(payload, input)

    expect(second.confirmation_code).toBe(first.confirmation_code)
    expect(second.access_token).toBe(first.access_token)
    expect(second.link_token).toBe(first.link_token)

    const updatedSlot = await getSlot(payload, slot.id)
    expect(updatedSlot['bookedCount']).toBe(1)
  })
})
