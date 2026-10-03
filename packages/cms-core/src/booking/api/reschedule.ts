import { sql } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

import { cancelBooking } from '../cancel-booking'
import { createBooking } from '../create-booking'
import { SlotUnavailableError } from '../errors'
import { getTransactionExecutor } from '../tx'
import { assertWithinCutoff } from './cutoff'
import { assertResourceActive, findSlot, verifyAppointmentAccess } from './entities'
import { BookingApiError } from './errors'
import type { RescheduleRequest, RescheduleResponse } from './schemas'
import { LINK_TOKEN_TTL_MS, deriveAccessToken, deriveLinkToken, hashAccessToken } from './tokens'

/**
 * Terminal AND cancelled statuses that a self-service reschedule must never
 * touch. Unlike NOT_CANCELLABLE_STATUSES in cancel.ts, this also excludes
 * `cancelled` — rescheduling an appointment that's already cancelled is
 * nonsensical (there is nothing to move). 'rescheduling' is a fast, cheap
 * pre-check for the same condition claimAppointmentForReschedule enforces
 * atomically below — this cuts a doomed request off before it validates the
 * new slot at all.
 */
const NOT_RESCHEDULABLE_STATUSES = new Set(['done', 'no_show', 'cancelled', 'rescheduling'])

/**
 * Atomically claims the old appointment for this reschedule attempt —
 * conditional UPDATE, same idiom as create-booking.ts's capacity claim and
 * cancel-booking.ts's status flip. Without this, two concurrent reschedule
 * requests for the SAME old appointment (e.g. two open tabs) could each
 * independently pass the status/cutoff checks and reserve a different new
 * slot, leaving the customer holding two new appointments instead of one.
 * Returns false if the appointment is no longer in 'booked' status (already
 * claimed by another request, or its status changed).
 */
async function claimAppointmentForReschedule(payload: Payload, appointmentId: number | string): Promise<boolean> {
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null || transactionID === undefined) {
    throw new Error('Could not begin a database transaction')
  }
  try {
    const db = getTransactionExecutor(payload, transactionID)
    const claim = await db.execute(sql`
      UPDATE appointments SET status = 'rescheduling' WHERE id = ${appointmentId} AND status = 'booked'
    `)
    await payload.db.commitTransaction(transactionID)
    return (claim.rowCount ?? 0) > 0
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID)
    throw err
  }
}

/**
 * Reverts a claim taken above when reserving the new slot then fails —
 * best-effort: a failure here must not mask the real error (SLOT_FULL etc.)
 * the caller is already about to surface, only log it. Leaving the
 * appointment stuck in 'rescheduling' would otherwise lock the customer out
 * of ever cancelling or rescheduling it again.
 */
async function releaseRescheduleClaim(payload: Payload, appointmentId: number | string): Promise<void> {
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null || transactionID === undefined) {
    payload.logger.error(`reschedule: could not begin transaction to release claim on appointment ${appointmentId}`)
    return
  }
  try {
    const db = getTransactionExecutor(payload, transactionID)
    await db.execute(sql`
      UPDATE appointments SET status = 'booked' WHERE id = ${appointmentId} AND status = 'rescheduling'
    `)
    await payload.db.commitTransaction(transactionID)
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID)
    payload.logger.error(`reschedule: failed to release reschedule claim on appointment ${appointmentId}: ${String(err)}`)
  }
}

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

/** Mirrors reserve.ts's assertSlotBookable, for the new_slot_id/new_resource_id pair. */
async function assertNewSlotBookable(
  payload: Payload,
  newSlotId: RescheduleRequest['new_slot_id'],
  newResourceId: RescheduleRequest['new_resource_id'],
) {
  const slot = await findSlot(payload, newSlotId)
  if (!slot) {
    throw new BookingApiError('INVALID_INPUT', 'new_slot_id does not exist')
  }
  if (String(slot.resource) !== String(newResourceId)) {
    throw new BookingApiError('INVALID_INPUT', 'new_slot_id does not belong to new_resource_id')
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
 * Best-effort: never lets a cancel failure here mask the new appointment's
 * success, or roll it back. A customer who temporarily holds both the new
 * and the (uncancelled) old appointment is the accepted safe-failure
 * direction — they must never end up with zero. Logged for staff
 * reconciliation; no retry queue (out of scope, see the WO-5 plan).
 */
async function cancelOldBestEffort(payload: Payload, oldAppointmentId: number | string): Promise<boolean> {
  try {
    await cancelBooking(payload, oldAppointmentId)
    return true
  } catch (err) {
    payload.logger.error(
      `reschedule: new appointment reserved but failed to cancel old appointment ${oldAppointmentId}: ${String(err)}`,
    )
    // The old appointment is still claimed ('rescheduling') at this point —
    // revert it to 'booked' so it isn't stuck in a status that blocks the
    // customer or staff from ever cancelling it directly. It's still a
    // live, actionable appointment; only its automatic cancellation failed.
    await releaseRescheduleClaim(payload, oldAppointmentId)
    return false
  }
}

/**
 * Reschedules an appointment by reserving the new slot FIRST and only
 * cancelling the old one on success — never the reverse. A customer must
 * never end up with zero appointments: if reserving the new slot fails (the
 * required case — see reschedule.integration.test.ts), the old appointment
 * is never touched; if cancelling the old one fails after the new slot was
 * successfully reserved, the customer temporarily holds both rather than
 * neither (see cancelOldBestEffort).
 *
 * cutoffHours is passed in by the caller (site-config's
 * booking.cancellationCutoffHours), same as handleCancel — this package
 * must not import a specific site.config.ts.
 */
export async function handleReschedule(
  payload: Payload,
  input: RescheduleRequest,
  cutoffHours: number,
): Promise<RescheduleResponse> {
  const oldAppointment = await verifyAppointmentAccess(payload, input.confirmation_code, input.access_token)

  // Fast idempotency path, checked BEFORE the status/cutoff checks below —
  // a retry of an already-successful reschedule must replay the original
  // result, not fail differently because the old appointment's status has
  // since moved to 'cancelled' as a side effect of that earlier attempt.
  // Mirrors reserve.ts's own idempotency fast path.
  const existing = await findExistingByIdempotencyKey(payload, input.idempotency_key)
  if (existing) {
    const oldAppointmentCancelled = await cancelOldBestEffort(payload, oldAppointment.id)
    return {
      confirmation_code: existing.confirmationCode,
      access_token: deriveAccessToken(input.idempotency_key),
      link_token: deriveLinkToken(input.idempotency_key),
      old_appointment_cancelled: oldAppointmentCancelled,
    }
  }

  if (NOT_RESCHEDULABLE_STATUSES.has(oldAppointment.status)) {
    throw new BookingApiError('INVALID_INPUT', 'This appointment can no longer be rescheduled')
  }
  assertWithinCutoff(oldAppointment.scheduledAt, cutoffHours)
  if (String(oldAppointment.slot) === String(input.new_slot_id)) {
    throw new BookingApiError('INVALID_INPUT', 'new_slot_id must be different from the current slot')
  }

  await assertResourceActive(payload, input.new_resource_id)
  const newSlot = await assertNewSlotBookable(payload, input.new_slot_id, input.new_resource_id)

  // Atomically claim the old appointment so a concurrent reschedule request
  // for this SAME appointment (a different idempotency_key — e.g. two open
  // tabs) cannot also pass this point. Not the idempotency fast path above,
  // which only replays an already-completed attempt for THIS idempotency
  // key — this guards against two DIFFERENT attempts racing each other.
  const claimed = await claimAppointmentForReschedule(payload, oldAppointment.id)
  if (!claimed) {
    throw new BookingApiError('INVALID_INPUT', 'This appointment can no longer be rescheduled')
  }

  const accessToken = deriveAccessToken(input.idempotency_key)
  const linkToken = deriveLinkToken(input.idempotency_key)

  let newAppointment
  try {
    const created = await createBooking(payload, {
      slotId: input.new_slot_id,
      customerId: oldAppointment.customer,
      serviceId: oldAppointment.service,
      visitType: oldAppointment.visitType,
      scheduledAt: newSlot.startsAt,
      idempotencyKey: input.idempotency_key,
      accessTokenHash: hashAccessToken(accessToken),
      manageLinkTokenHash: hashAccessToken(linkToken),
      manageLinkTokenExpiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString(),
      source: 'web',
    })
    newAppointment = created.appointment
  } catch (err) {
    // Bookable at the pre-check above but lost the race for capacity —
    // release the claim so the old appointment isn't stuck in
    // 'rescheduling' limbo, then surface the real error.
    await releaseRescheduleClaim(payload, oldAppointment.id)
    if (err instanceof SlotUnavailableError) {
      throw new BookingApiError('SLOT_FULL', 'The selected slot is no longer available')
    }
    throw err
  }

  const oldAppointmentCancelled = await cancelOldBestEffort(payload, oldAppointment.id)

  return {
    confirmation_code: newAppointment.confirmationCode,
    access_token: accessToken,
    link_token: linkToken,
    old_appointment_cancelled: oldAppointmentCancelled,
  }
}
