/**
 * "Day before the appointment" — always computed this way, even when the
 * result lands in the past (a same-day/short-notice booking). That's
 * expected: the cron's `scheduled_for <= now()` due-query picks it up
 * immediately in that case, and customer-reminder.ts's copy is written to
 * read correctly either way. See reminder-schedule usage in service.ts and
 * templates/customer-reminder.ts's doc comment.
 *
 * `reminderHourLocal` is currently IGNORED — the result always targets
 * 00:00 UTC of the day before, not the configured hour. This is a direct
 * consequence of the cron's once-daily-at-midnight-UTC schedule
 * (vercel.json), chosen for Hobby-plan safety: a reminder timestamped
 * "day-before @ 9am" is never due at the day-before's midnight cron run
 * (9am hasn't happened yet) and only becomes due at the NEXT run — the
 * appointment's own day — silently turning every "day before" reminder into
 * a "day of" one. Targeting the day-before's 00:00 UTC instead is the
 * earliest moment that run can act on, so the reminder reliably lands on
 * the correct calendar day, which is the literal, load-bearing part of the
 * requirement; the specific hour is not achievable under a once-daily cron
 * regardless of this function's formula.
 *
 * `reminderHourLocal` stays a required parameter (and a site-config field)
 * so re-enabling it is a one-line change here, not a call-site or schema
 * change — do so when the cron moves to an hourly cadence (tracked for
 * WO-8's production cadence change, see vercel.json's schedule comment).
 *
 * Appointment times are stored/compared UTC-only throughout this app (see
 * templates/shared.ts's formatDateTime).
 */
export function computeReminderScheduledFor(
  appointmentScheduledAtIso: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for a one-line re-enable, see doc comment above
  reminderHourLocal: number,
): string {
  const appointmentDate = new Date(appointmentScheduledAtIso)
  return new Date(
    Date.UTC(appointmentDate.getUTCFullYear(), appointmentDate.getUTCMonth(), appointmentDate.getUTCDate() - 1, 0, 0, 0),
  ).toISOString()
}
