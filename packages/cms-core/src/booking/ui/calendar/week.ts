const DAY_MS = 24 * 60 * 60 * 1000

/** Monday-start week, computed in UTC to match the API's date-only strings. */
export function startOfWeek(date: Date): Date {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utcDate.getUTCDay() // 0=Sun..6=Sat
  const daysSinceMonday = (day + 6) % 7
  utcDate.setUTCDate(utcDate.getUTCDate() - daysSinceMonday)
  return utcDate
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Disallows navigating to a week entirely before the one containing `today` — the spec's "do not allow navigating into the past" rule. */
export function canGoToPreviousWeek(weekStart: Date, today: Date): boolean {
  return weekStart.getTime() > startOfWeek(today).getTime()
}
