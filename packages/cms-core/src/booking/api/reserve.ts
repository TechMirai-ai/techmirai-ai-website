import type { Payload } from 'payload'

import { createBooking } from '../create-booking'
import { SlotUnavailableError } from '../errors'
import { assertResourceActive, assertServiceActive, findSlot } from './entities'
import { BookingApiError } from './errors'
import type { ReserveRequest, ReserveResponse } from './schemas'
import { LINK_TOKEN_TTL_MS, deriveAccessToken, deriveLinkToken, hashAccessToken } from './tokens'

function assertNoHoneypot(input: ReserveRequest): void {
  if (input._hp) {
    throw new BookingApiError('INVALID_INPUT', 'Invalid request')
  }
}

/**
 * Validates the slot referenced by slot_id/resource_id and classifies why it
 * isn't bookable, if it isn't. This is purely for accurate error reporting —
 * the engine's atomic conditional UPDATE (see create-booking.ts) is still the
 * sole source of truth for whether the claim actually succeeds. A race
 * between this check and the atomic claim is handled in the catch block of
 * handleReserve, which falls back to SLOT_FULL.
 */
async function assertSlotBookable(payload: Payload, input: ReserveRequest) {
  const slot = await findSlot(payload, input.slot_id)
  if (!slot) {
    throw new BookingApiError('INVALID_INPUT', 'slot_id does not exist')
  }
  if (String(slot.resource) !== String(input.resource_id)) {
    throw new BookingApiError('INVALID_INPUT', 'slot_id does not belong to resource_id')
  }
  if (slot.status !== 'open') {
    throw new BookingApiError('SLOT_CLOSED', 'The selected slot is closed or blocked')
  }
  if (slot.bookedCount >= slot.capacity) {
    throw new BookingApiError('SLOT_FULL', 'The selected slot is full')
  }
  return slot
}

/**
 * Fast idempotency path, checked before any validation or customer creation —
 * mirrors create-booking.ts's own findByIdempotencyKey fast path. Without
 * this, a retry of an already-successful reservation would run the
 * slot-bookable pre-check against a slot that this same request already
 * filled, incorrectly reporting SLOT_FULL instead of replaying the original
 * result. Checking first also avoids creating a redundant customers row on
 * every retry.
 */
async function findExistingByIdempotencyKey(
  payload: Payload,
  idempotencyKey: string,
): Promise<{ confirmationCode: string } | undefined> {
  const result = await payload.find({
    collection: 'appointments',
    where: { idempotencyKey: { equals: idempotencyKey } },
    limit: 1,
    depth: 0,
  })
  return result.docs[0] as { confirmationCode: string } | undefined
}

interface ResolvedCustomer {
  id: number | string
  /** Whether THIS call created the row — governs the orphan-cleanup path
   * below: a reused existing customer must never be deleted on failure. */
  isNew: boolean
}

interface ExistingCustomerDoc {
  id: number | string
  lineUserId?: string | null
  locale?: string | null
}

/**
 * Resolves the customer row for a reservation, enforcing phone-number
 * uniqueness at this shared layer — used by web, chat, and the LIFF flow
 * alike, not a LINE-only check (STEP 2 Part 2 item 5; web/chat bookings
 * could hit the identical phone collision before this with zero guard).
 *
 * `verifiedLineUserId` MUST already be verified server-side (see
 * apps/techmirai-web's reserve route, which calls
 * @techmirai/cms-core/line's verifyLineIdToken before this) — this
 * function trusts it completely, never re-derives or re-checks it.
 *
 * Resolution order:
 *   1. If verifiedLineUserId is already linked to a customer, that IS the
 *      customer for this booking — reused directly by identity, whatever
 *      phone was submitted (item 6's shortcut path, or any repeat booking
 *      under the same account). This also guarantees the "create new
 *      customer" branch below never inserts a lineUserId that's already
 *      attached elsewhere — customers.lineUserId is unique-indexed
 *      (STEP 2 Part 1's migration), so a second insert would otherwise
 *      throw a raw constraint-violation error.
 *   2. Otherwise, match by phone, REJECT-ONLY — this branch never reuses
 *      an existing row, only rejects or falls through to create a new one:
 *      - An existing customer with this phone already linked to a
 *        DIFFERENT lineUserId (step 1 already ruled out "the same one")
 *        → reject. Neither an anonymous caller nor a different LINE
 *        account can prove they're that customer.
 *      - An existing customer with this phone and NO lineUserId set →
 *        deliberately does NOT reuse that row for this booking, even
 *        though this looks like an "ordinary repeat booking" on paper.
 *        A phone number alone is not a verified credential in this
 *        system (anyone can type it into the contact form), so treating
 *        a bare match as proof of identity doesn't just risk a
 *        mis-attached lineUserId — it lets an unrelated caller get a
 *        REAL APPOINTMENT created against a stranger's existing patient
 *        record ("booking injection"), independent of whether a LINE
 *        session is involved at all. Falls through to create a genuinely
 *        new customer row instead. See reserve.integration.test.ts's
 *        "SECURITY:" tests for the exact attacks this closes — an
 *        accepted duplicate contact record (mergeable by staff via
 *        /admin) is the deliberately safer failure mode versus
 *        attributing a real appointment to the wrong patient.
 *      - No existing customer with this phone → nothing to hijack;
 *        lineUserId (if present) is trusted on the new row below.
 *   3. Create a new customer, attaching verifiedLineUserId if present —
 *      always safe here: step 1 already proved this lineUserId isn't
 *      attached to anyone else, and this is by construction a fresh row,
 *      never an existing patient's.
 */
async function resolveCustomer(
  payload: Payload,
  input: ReserveRequest,
  verifiedLineUserId: string | null,
): Promise<ResolvedCustomer> {
  if (verifiedLineUserId) {
    const linkedResult = await payload.find({
      collection: 'customers',
      where: { lineUserId: { equals: verifiedLineUserId } },
      limit: 1,
    })
    const linked = linkedResult.docs[0] as unknown as ExistingCustomerDoc | undefined
    if (linked) {
      // A LINE-linked customer's record persists across repeat bookings
      // (unlike the phone-match branch below, which never reuses a row) —
      // without this, a returning customer who booked once in one language
      // and comes back in the other keeps getting confirmations in whatever
      // language happened to be stored the first time, on LINE only (email
      // never hits this branch: a repeat web/email booker always gets a
      // fresh customer row with a fresh locale, see the doc comment above).
      if (linked.locale !== input.locale) {
        await payload.update({ collection: 'customers', id: linked.id, data: { locale: input.locale } })
      }
      return { id: linked.id, isNew: false }
    }
  }

  const existingResult = await payload.find({
    collection: 'customers',
    where: { phone: { equals: input.customer.phone } },
    limit: 1,
  })
  const existing = existingResult.docs[0] as unknown as ExistingCustomerDoc | undefined

  if (existing) {
    // existing.lineUserId can't equal verifiedLineUserId here when
    // verifiedLineUserId is truthy — step 1 would have already matched
    // and returned. A non-null existing.lineUserId therefore always
    // means "linked to someone else" — reject. A null existing.lineUserId
    // falls through to create-new below rather than reusing (see the doc
    // comment above).
    const existingLineUserId = existing.lineUserId ?? null
    if (existingLineUserId !== null) {
      throw new BookingApiError('PHONE_ALREADY_REGISTERED', 'This phone number is already registered.')
    }
  }

  const created = await payload.create({
    collection: 'customers',
    data: {
      familyName: input.customer.family_name,
      givenName: input.customer.given_name,
      familyNameKana: input.customer.family_name_kana,
      givenNameKana: input.customer.given_name_kana,
      company: input.customer.company,
      phone: input.customer.phone,
      email: input.customer.email,
      locale: input.locale,
      lineUserId: verifiedLineUserId ?? undefined,
    },
  })
  return { id: created.id, isNew: true }
}

/**
 * Validates and reserves a slot via the WO-1 engine, formatting the result.
 *
 * `verifiedLineUserId` is the LINE user id from a LIFF booking session,
 * ALREADY verified server-side against LINE's own endpoint by the caller
 * (see resolveCustomer's doc comment) — null for a plain web/chat booking.
 * Defaults to null so any other existing caller of handleReserve keeps
 * working unchanged.
 */
export async function handleReserve(
  payload: Payload,
  input: ReserveRequest,
  verifiedLineUserId: string | null = null,
): Promise<ReserveResponse> {
  assertNoHoneypot(input)

  const existing = await findExistingByIdempotencyKey(payload, input.idempotency_key)
  if (existing) {
    return {
      confirmation_code: existing.confirmationCode,
      access_token: deriveAccessToken(input.idempotency_key),
      link_token: deriveLinkToken(input.idempotency_key),
    }
  }

  await assertServiceActive(payload, input.service_id)
  await assertResourceActive(payload, input.resource_id)
  const slot = await assertSlotBookable(payload, input)

  const customer = await resolveCustomer(payload, input, verifiedLineUserId)

  const accessToken = deriveAccessToken(input.idempotency_key)
  const accessTokenHash = hashAccessToken(accessToken)
  const linkToken = deriveLinkToken(input.idempotency_key)
  const manageLinkTokenHash = hashAccessToken(linkToken)
  const manageLinkTokenExpiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString()

  try {
    const { appointment } = await createBooking(payload, {
      slotId: input.slot_id,
      customerId: customer.id,
      serviceId: input.service_id,
      visitType: input.visit_type,
      scheduledAt: slot.startsAt,
      idempotencyKey: input.idempotency_key,
      accessTokenHash,
      manageLinkTokenHash,
      manageLinkTokenExpiresAt,
      source: 'web',
    })

    return {
      confirmation_code: appointment.confirmationCode,
      access_token: accessToken,
      link_token: linkToken,
    }
  } catch (err) {
    // Whatever failed, a NEWLY created customer row is now orphaned — no
    // appointment will ever reference it, on ANY failure out of
    // createBooking (a lost capacity race, a DB constraint violation, a
    // connection drop), not just SlotUnavailableError. Clean it up rather
    // than leaving PII behind. A REUSED existing customer (isNew: false)
    // must never be deleted here — it has its own history unrelated to
    // this failed request. Best-effort: a cleanup failure must not mask
    // the real error the caller needs to see.
    if (customer.isNew) {
      await payload.delete({ collection: 'customers', id: customer.id }).catch((cleanupErr: unknown) => {
        payload.logger.warn(
          `handleReserve: failed to clean up orphaned customer ${customer.id} after reservation failure: ${String(cleanupErr)}`,
        )
      })
    }

    if (err instanceof SlotUnavailableError) {
      // Bookable at the pre-check above but lost the race for capacity at
      // the engine's atomic claim — SLOT_FULL is the accurate classification
      // for that specific race (see assertSlotBookable's doc comment).
      throw new BookingApiError('SLOT_FULL', 'The selected slot is no longer available')
    }
    throw err
  }
}
