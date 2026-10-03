import { randomBytes } from 'node:crypto'

import { sql } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'
import { z } from 'zod'

import { SlotUnavailableError } from './errors'
import { getTransactionExecutor } from './tx'

const idSchema = z.union([z.string().min(1), z.number()])

/**
 * Runtime validation of the trust boundary. TypeScript types are erased at
 * runtime, so an empty idempotencyKey (which would make the fast-path match
 * unrelated rows) or a malformed visitType must be rejected before any
 * transaction begins.
 */
const createBookingSchema = z.object({
  slotId: idSchema,
  customerId: idSchema,
  serviceId: idSchema,
  visitType: z.enum(['first', 'return']),
  scheduledAt: z.union([z.string().min(1), z.date()]),
  idempotencyKey: z.string().min(1),
  source: z.string().min(1).optional(),
  accessTokenHash: z.string().min(1).nullable().optional(),
  manageLinkTokenHash: z.string().min(1).nullable().optional(),
  manageLinkTokenExpiresAt: z.union([z.string().min(1), z.date()]).nullable().optional(),
})

export type CreateBookingInput = z.input<typeof createBookingSchema>

export interface BookingAppointment {
  id: number | string
  confirmationCode: string
  [key: string]: unknown
}

export interface CreateBookingResult {
  appointment: BookingAppointment
  /** True when an existing appointment was returned instead of creating a new one. */
  idempotentReplay: boolean
}

/** 6 bytes → 12 uppercase hex chars (48 bits of entropy). */
const CONFIRMATION_CODE_BYTES = 6

function generateConfirmationCode(): string {
  return randomBytes(CONFIRMATION_CODE_BYTES).toString('hex').toUpperCase()
}

async function findByIdempotencyKey(
  payload: Payload,
  idempotencyKey: string,
): Promise<BookingAppointment | null> {
  const result = await payload.find({
    collection: 'appointments',
    where: { idempotencyKey: { equals: idempotencyKey } },
    limit: 1,
    depth: 0,
  })
  const doc = result.docs[0]
  return doc ? (doc as unknown as BookingAppointment) : null
}

/**
 * Atomically reserve one unit of capacity on a slot and create the
 * appointment. The capacity claim and the appointment INSERT run in a single
 * transaction, so a failure at either step frees the reserved capacity.
 *
 * Idempotency is enforced by the UNIQUE constraint on `idempotency_key`: a
 * retried request never creates a second appointment. When a duplicate is
 * detected (either up front or via the constraint under concurrency) the
 * original appointment — with its original confirmation code — is returned.
 */
export async function createBooking(
  payload: Payload,
  rawInput: CreateBookingInput,
): Promise<CreateBookingResult> {
  const input = createBookingSchema.parse(rawInput)

  // Fast path: an identical request already committed.
  const existing = await findByIdempotencyKey(payload, input.idempotencyKey)
  if (existing) {
    return { appointment: existing, idempotentReplay: true }
  }

  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null || transactionID === undefined) {
    throw new Error('Could not begin a database transaction')
  }

  try {
    // Conditional claim. Zero rows affected ⇒ full, blocked, or closed.
    const db = getTransactionExecutor(payload, transactionID)
    const claim = await db.execute(sql`
      UPDATE slots
      SET booked_count = booked_count + 1
      WHERE id = ${input.slotId} AND booked_count < capacity AND status = 'open'
    `)
    if ((claim.rowCount ?? 0) === 0) {
      throw new SlotUnavailableError()
    }

    const scheduledAt =
      input.scheduledAt instanceof Date ? input.scheduledAt.toISOString() : input.scheduledAt
    const manageLinkTokenExpiresAt =
      input.manageLinkTokenExpiresAt instanceof Date
        ? input.manageLinkTokenExpiresAt.toISOString()
        : (input.manageLinkTokenExpiresAt ?? null)

    const created = await payload.create({
      collection: 'appointments',
      data: {
        slot: input.slotId,
        customer: input.customerId,
        service: input.serviceId,
        status: 'booked',
        visitType: input.visitType,
        scheduledAt,
        confirmationCode: generateConfirmationCode(),
        accessTokenHash: input.accessTokenHash ?? null,
        manageLinkTokenHash: input.manageLinkTokenHash ?? null,
        manageLinkTokenExpiresAt,
        idempotencyKey: input.idempotencyKey,
        source: input.source ?? 'system',
      },
      req: { transactionID },
    })

    await payload.db.commitTransaction(transactionID)
    return { appointment: created as unknown as BookingAppointment, idempotentReplay: false }
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID)

    // Under concurrency a sibling with the same idempotency key may have
    // committed first (unique violation) or taken the last capacity ahead of
    // us. If a matching appointment now exists, honour idempotency.
    const duplicate = await findByIdempotencyKey(payload, input.idempotencyKey)
    if (duplicate) {
      return { appointment: duplicate, idempotentReplay: true }
    }

    throw err
  }
}
