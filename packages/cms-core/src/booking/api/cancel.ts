import type { Payload } from 'payload'

import { cancelBooking } from '../cancel-booking'
import { assertWithinCutoff } from './cutoff'
import { verifyAppointmentAccess } from './entities'
import { BookingApiError } from './errors'
import type { CancelRequest, CancelResponse } from './schemas'

/**
 * Terminal statuses that a self-service cancel must never touch. The
 * engine's own guard (cancel-booking.ts) only excludes `status = 'cancelled'`
 * — it has no opinion on which states are "still cancellable", because that
 * is a business rule, not a capacity/atomicity concern. A completed or
 * no-show visit is history; cancelling it would corrupt attendance/billing
 * records even though the customer may still hold a valid code and token.
 */
const NOT_CANCELLABLE_STATUSES = new Set(['done', 'no_show', 'rescheduling'])

/**
 * Cancelling twice is not an error — cancelBooking() itself is idempotent
 * (see cancel-booking.ts), so once code+token verify and the cutoff clears,
 * this always succeeds for any appointment still in a pre-visit state.
 *
 * cutoffHours is passed in by the caller (sourced from site-config's
 * booking.cancellationCutoffHours) rather than read here — this package is
 * tenant-agnostic and must not import a specific site.config.ts.
 */
export async function handleCancel(
  payload: Payload,
  input: CancelRequest,
  cutoffHours: number,
): Promise<CancelResponse> {
  const appointment = await verifyAppointmentAccess(payload, input.confirmation_code, input.access_token)
  if (NOT_CANCELLABLE_STATUSES.has(appointment.status)) {
    throw new BookingApiError('INVALID_INPUT', 'This appointment has already been completed and cannot be cancelled')
  }
  // The cutoff protects the clinic from a NEW last-minute cancellation — it
  // must not also block a harmless retry of one that already happened
  // (cancelBooking is idempotent; scheduledAt never changes, so a retry
  // arriving after enough real time has passed would otherwise start
  // throwing CUTOFF_PASSED for an appointment that's already cancelled).
  if (appointment.status !== 'cancelled') {
    assertWithinCutoff(appointment.scheduledAt, cutoffHours)
  }
  const { alreadyCancelled } = await cancelBooking(payload, appointment.id)
  return { status: 'cancelled', already_cancelled: alreadyCancelled }
}
