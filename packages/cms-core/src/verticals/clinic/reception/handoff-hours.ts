// ─────────────────────────────────────────────────────────────────────────────
// Hand-off hours — is a person likely to reply right now? (Spec §16.5)
//
// A pure function over an injected clock, so the 23:00 case (Spec §16.7 row 15)
// is a unit test rather than a wait. The schedule itself is host config
// (`site.config.ts` reception.handoffHours). Its VALUES are an unconfirmed
// launch blocker — see docs/PLACEHOLDER-REGISTER.md K2-01 — so nothing here
// should be read as "TechMirai's confirmed business hours".
// ─────────────────────────────────────────────────────────────────────────────

export interface HandoffHours {
  /** IANA zone the schedule is written in, e.g. `Asia/Tokyo`. */
  timeZone: string
  /** ISO weekdays the team replies on: 1 = Monday … 7 = Sunday. */
  days: readonly number[]
  /** `HH:MM`, 24-hour, inclusive. */
  start: string
  /** `HH:MM`, 24-hour, exclusive. */
  end: string
}

const WEEKDAY_TO_ISO: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/

function toMinutes(time: string): number | null {
  const match = TIME.exec(time)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/**
 * True when `now`, read in `hours.timeZone`, falls on one of `hours.days`
 * between `start` (inclusive) and `end` (exclusive). A malformed schedule or an
 * unknown time zone returns `null` — "cannot tell" — never a guess, so the
 * caller can fall back to wording that makes no hours claim.
 */
export function isWithinHandoffHours(now: Date, hours: HandoffHours): boolean | null {
  const start = toMinutes(hours.start)
  const end = toMinutes(hours.end)
  if (start === null || end === null) return null

  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: hours.timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
  } catch {
    return null
  }

  const weekday = WEEKDAY_TO_ISO[parts.find((p) => p.type === 'weekday')?.value ?? '']
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value)
  if (weekday === undefined || Number.isNaN(hour) || Number.isNaN(minute)) return null

  const minutes = hour * 60 + minute
  return hours.days.includes(weekday) && minutes >= start && minutes < end
}
