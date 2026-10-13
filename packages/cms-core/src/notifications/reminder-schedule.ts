import { toBookingDate } from '../booking/time-zone'

/**
 * Day-before reminder, due at about 09:00 JST on the day before the
 * appointment's Tokyo calendar date (D-4 Option B, approved by Jamal). This is
 * NOT an exact 24-hour reminder: a 09:00 JST appointment is reminded about 24h
 * ahead, a 17:30 JST one about 32.5h ahead. Never describe it as "24 hours
 * before".
 *
 * The result is always computed this way, even when it lands in the past (a
 * same-day/short-notice booking). That's expected: the cron's
 * `scheduled_for <= now()` due-query picks it up at its next run, and
 * customer-reminder.ts's copy (Spec 12.4, which names no lead time) reads
 * correctly either way.
 *
 * Why 00:00 UTC: 00:00 UTC is 09:00 JST, and it is the instant the only
 * scheduler (one daily Vercel cron, `0 0 * * *` in vercel.json) can act on. A
 * reminder timestamped for a later hour on the day before would not be due at
 * that run and would only go out at the NEXT one, the appointment's own day.
 * No paid plan or external scheduler is used (D-4).
 *
 * `reminderHourLocal` is therefore IGNORED. It stays a required parameter (and
 * a site-config field, currently 9, matching this behaviour) so that a future
 * hourly scheduler could re-enable it without a call-site or schema change.
 *
 * The "day before" is taken on the Tokyo calendar (booking/time-zone.ts), not
 * the UTC calendar, so an early-morning JST appointment (the previous UTC date)
 * is still reminded on the day before its Tokyo date. Appointment instants are
 * stored and compared in UTC.
 *
 * Reminders are still withheld outside local development
 * (notifications/customer-send-policy.ts, J2-12); see
 * docs/PLACEHOLDER-REGISTER.md J2-09.
 */
export function computeReminderScheduledFor(
  appointmentScheduledAtIso: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for a one-line re-enable, see doc comment above
  reminderHourLocal: number,
): string {
  const [year, month, day] = toBookingDate(appointmentScheduledAtIso).split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0)).toISOString()
}
