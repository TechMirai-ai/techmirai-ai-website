import { describe, expect, it } from 'vitest'

import { computeReminderScheduledFor } from './reminder-schedule'

describe('computeReminderScheduledFor', () => {
  it('computes 00:00 UTC on the day before the appointment', () => {
    const result = computeReminderScheduledFor('2026-08-06T14:30:00.000Z', 9)
    expect(result).toBe('2026-08-05T00:00:00.000Z')
  })

  it('lands on the correct calendar day regardless of reminderHourLocal — currently inert under the once-daily-at-midnight cron', () => {
    // reminderHourLocal is ignored: any value here must produce the exact
    // same "day before, 00:00 UTC" result, since a once-daily cron running
    // at 00:00 UTC can only ever act on that instant — targeting a later
    // hour on the day-before would push delivery to the appointment's own
    // day instead (the bug this function's fix addresses). Re-enable
    // reminderHourLocal here once the cron moves to an hourly cadence.
    for (const hour of [0, 1, 9, 17, 23]) {
      const result = computeReminderScheduledFor('2026-08-06T14:30:00.000Z', hour)
      expect(result).toBe('2026-08-05T00:00:00.000Z')
    }
  })

  it('can land in the past for a same-day/short-notice booking — this is expected, not a bug', () => {
    // An appointment later today computes a scheduledFor that is already
    // <= now. The cron's due-query and the reminder template's
    // same-day-safe wording are what handle this, not this function — it
    // always just computes "day before, 00:00 UTC".
    const now = new Date()
    const laterToday = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    const result = computeReminderScheduledFor(laterToday, 9)

    expect(new Date(result).getTime()).toBeLessThan(now.getTime())
  })

  it('handles a month/year boundary correctly', () => {
    const result = computeReminderScheduledFor('2026-01-01T05:00:00.000Z', 9)
    expect(result).toBe('2025-12-31T00:00:00.000Z')
  })
})
