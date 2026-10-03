import { sql } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

import { getTransactionExecutor } from './tx'

export interface CancelledAppointment {
  id: number | string
  status: string
  [key: string]: unknown
}

export interface CancelBookingResult {
  appointment: CancelledAppointment
  /** True when the appointment was already cancelled (no capacity change). */
  alreadyCancelled: boolean
}

/**
 * Cancel an appointment and release its capacity, atomically.
 *
 * The status transition is itself the atomic guard: a single conditional
 * UPDATE flips `booked → cancelled` only if the row is not already cancelled,
 * mirroring the capacity claim in create-booking. Concurrent cancels of the
 * same appointment therefore decrement `booked_count` at most once — the
 * second cancel's UPDATE affects zero rows and returns `alreadyCancelled:
 * true` without touching capacity. This closes the read-then-write race that a
 * plain SELECT-then-UPDATE would expose under READ COMMITTED.
 */
export async function cancelBooking(
  payload: Payload,
  appointmentId: number | string,
): Promise<CancelBookingResult> {
  const transactionID = await payload.db.beginTransaction()
  if (transactionID === null || transactionID === undefined) {
    throw new Error('Could not begin a database transaction')
  }

  try {
    const db = getTransactionExecutor(payload, transactionID)

    // Atomic status transition. RETURNING gives us the slot to free; zero rows
    // means it was already cancelled (or never existed).
    const flip = await db.execute(sql`
      UPDATE appointments
      SET status = 'cancelled'
      WHERE id = ${appointmentId} AND status <> 'cancelled'
      RETURNING slot_id
    `)

    if ((flip.rowCount ?? 0) === 0) {
      await payload.db.commitTransaction(transactionID)
      const existing = await payload.findByID({
        collection: 'appointments',
        id: appointmentId,
        depth: 0,
        disableErrors: true,
      })
      if (!existing) {
        throw new Error(`Appointment ${appointmentId} not found`)
      }
      return { appointment: existing as unknown as CancelledAppointment, alreadyCancelled: true }
    }

    const slotId = (flip.rows[0] as { slot_id: number | string }).slot_id
    const released = await db.execute(sql`
      UPDATE slots
      SET booked_count = booked_count - 1
      WHERE id = ${slotId} AND booked_count > 0
    `)
    if ((released.rowCount ?? 0) === 0) {
      // The status flip succeeded but there was no capacity to release — an
      // inconsistency worth surfacing rather than silently masking.
      payload.logger.warn(
        `cancelBooking: slot ${slotId} had booked_count = 0 while cancelling appointment ${appointmentId}`,
      )
    }

    const updated = await payload.findByID({
      collection: 'appointments',
      id: appointmentId,
      depth: 0,
      req: { transactionID },
    })

    await payload.db.commitTransaction(transactionID)
    return { appointment: updated as unknown as CancelledAppointment, alreadyCancelled: false }
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID)
    throw err
  }
}
