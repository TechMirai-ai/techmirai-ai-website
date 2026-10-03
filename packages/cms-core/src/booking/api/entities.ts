import type { Payload } from 'payload'

import { BookingApiError } from './errors'
import type { entityIdSchema } from './schemas'
import { DUMMY_HASH, dummyVerify, verifyAccessToken } from './tokens'
import type { z } from 'zod'

type EntityId = z.infer<typeof entityIdSchema>

/** Shared existence/active checks reused by availability.ts and reserve.ts. */

export async function assertServiceActive(payload: Payload, serviceId: EntityId): Promise<void> {
  const service = await payload.findByID({
    collection: 'bookable-services',
    id: serviceId,
    depth: 0,
    disableErrors: true,
  })
  if (!service || service['active'] === false) {
    throw new BookingApiError('INVALID_INPUT', 'service_id does not reference an active service')
  }
}

export async function assertResourceActive(payload: Payload, resourceId: EntityId): Promise<void> {
  const resource = await payload.findByID({
    collection: 'resources',
    id: resourceId,
    depth: 0,
    disableErrors: true,
  })
  if (!resource || resource['active'] === false) {
    throw new BookingApiError('INVALID_INPUT', 'resource_id does not reference an active resource')
  }
}

export interface SlotDoc {
  id: number | string
  resource: number | string
  startsAt: string
  endsAt: string
  capacity: number
  bookedCount: number
  status: 'open' | 'blocked' | 'closed'
}

export async function findSlot(payload: Payload, slotId: EntityId): Promise<SlotDoc | null> {
  const doc = await payload.findByID({
    collection: 'slots',
    id: slotId,
    depth: 0,
    disableErrors: true,
  })
  return doc ? (doc as unknown as SlotDoc) : null
}

export interface AppointmentAccess {
  id: number | string
  confirmationCode: string
  // Optional on the appointments collection — appointments created outside
  // /reserve (walk-in/phone, see the collection's `source` field) may have
  // no access token at all.
  accessTokenHash: string | null | undefined
  // The customer's second, expiring credential (see tokens.ts's
  // deriveLinkToken) — also optional, for the same reason accessTokenHash is,
  // plus appointments booked before this credential existed.
  manageLinkTokenHash: string | null | undefined
  manageLinkTokenExpiresAt: string | null | undefined
  status: string
  visitType: 'first' | 'return'
  scheduledAt: string
  service: EntityId
  // Raw customer id — needed by /reschedule to book the new slot under the
  // same customer without creating a duplicate. Same "already on the row,
  // no extra query" reasoning as service/slot below.
  customer: EntityId
  // Raw slot id, NOT resolved to {id, resource} here — see
  // findAppointmentByCode's doc comment for why that resolution must happen
  // only after access is verified, not inside this shared lookup path.
  slot: EntityId
}

interface RawAppointmentDoc {
  id: EntityId
  confirmationCode: string
  accessTokenHash: string | null | undefined
  manageLinkTokenHash: string | null | undefined
  manageLinkTokenExpiresAt: string | null | undefined
  status: string
  visitType: 'first' | 'return'
  scheduledAt: string
  service: EntityId
  customer: EntityId
  slot: EntityId
}

/**
 * Resolves only the appointment row — deliberately does NOT also resolve the
 * slot here. A "code exists" response used to cost one extra DB round-trip
 * (findSlot) versus "code doesn't exist", which is itself a timing oracle:
 * crypto-timing-safety (dummyVerify) only equalizes CPU cost, not I/O cost,
 * and a DB round-trip dwarfs a SHA-256 compare. Both branches now cost
 * exactly one query. Callers that need the resolved slot (lookup.ts) fetch
 * it themselves, after verifyAppointmentAccess has already succeeded.
 */
async function findAppointmentByCode(payload: Payload, code: string): Promise<AppointmentAccess | null> {
  const result = await payload.find({
    collection: 'appointments',
    where: { confirmationCode: { equals: code } },
    limit: 1,
    depth: 0,
  })
  const doc = result.docs[0] as unknown as RawAppointmentDoc | undefined
  if (!doc) return null

  return {
    id: doc.id,
    confirmationCode: doc.confirmationCode,
    accessTokenHash: doc.accessTokenHash,
    manageLinkTokenHash: doc.manageLinkTokenHash,
    manageLinkTokenExpiresAt: doc.manageLinkTokenExpiresAt,
    status: doc.status,
    visitType: doc.visitType,
    scheduledAt: doc.scheduledAt,
    service: doc.service,
    customer: doc.customer,
    slot: doc.slot,
  }
}

export const CODE_OR_TOKEN_ERROR_MESSAGE = 'No appointment found for that code and token combination'

/**
 * Timing-safe code+token lookup shared by /cancel, /lookup, and /reschedule.
 * Accepts EITHER the permanent access_token OR the expiring linkToken (see
 * tokens.ts's deriveLinkToken) — they are interchangeable at this layer, the
 * caller doesn't know or care which one it received. A wrong token and a
 * nonexistent code produce the identical NOT_FOUND error, both in shape and
 * in the amount of crypto work performed, so neither response nor timing
 * reveals whether a given code exists, nor which credential (if either) a
 * presented token was checked against.
 *
 * Both timingSafeEqual compares (access_token, linkToken) ALWAYS run, never
 * short-circuited on each other or on a missing hash — verifyAccessToken is
 * called with DUMMY_HASH in place of a null hash column so an appointment
 * missing one credential doesn't verify faster than one with both set. The
 * not-found branch mirrors this exactly via dummyVerify(), which itself now
 * burns two compares (see tokens.ts).
 */
export async function verifyAppointmentAccess(
  payload: Payload,
  code: string,
  token: string,
): Promise<AppointmentAccess> {
  const appointment = await findAppointmentByCode(payload, code)
  if (!appointment) {
    dummyVerify(token)
    throw new BookingApiError('NOT_FOUND', CODE_OR_TOKEN_ERROR_MESSAGE)
  }

  const accessMatch = verifyAccessToken(token, appointment.accessTokenHash ?? DUMMY_HASH)
  const linkMatch = verifyAccessToken(token, appointment.manageLinkTokenHash ?? DUMMY_HASH)
  const linkNotExpired =
    appointment.manageLinkTokenExpiresAt !== null &&
    appointment.manageLinkTokenExpiresAt !== undefined &&
    new Date(appointment.manageLinkTokenExpiresAt).getTime() > Date.now()

  if (!accessMatch && !(linkMatch && linkNotExpired)) {
    throw new BookingApiError('NOT_FOUND', CODE_OR_TOKEN_ERROR_MESSAGE)
  }
  return appointment
}
