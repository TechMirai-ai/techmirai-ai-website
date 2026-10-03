import { BookingApiError } from './errors'

/**
 * Enforces the clinic's cancellation/reschedule cutoff (site-config
 * `booking.cancellationCutoffHours`) SERVER-SIDE, shared by /cancel and
 * /reschedule — not just hidden in the UI. The UI hint (buttons vs phone
 * number) is trivially bypassable; this is the actual business rule.
 *
 * Boundary is inclusive: exactly `cutoffHours` before the appointment is
 * still allowed, anything less is not.
 */
export function assertWithinCutoff(scheduledAt: string, cutoffHours: number, now: Date = new Date()): void {
  const cutoffMs = cutoffHours * 60 * 60 * 1000
  const msUntilAppointment = new Date(scheduledAt).getTime() - now.getTime()
  if (msUntilAppointment < cutoffMs) {
    throw new BookingApiError(
      'CUTOFF_PASSED',
      'This appointment is too close to its scheduled time to be changed online. Please call the clinic.',
    )
  }
}
