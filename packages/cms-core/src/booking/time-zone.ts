/**
 * Display and date-grouping zone for every booking time (open decision D2,
 * approved by Jamal: Asia/Tokyo). Stored instants stay UTC — only how a slot
 * or appointment is shown, and which calendar date a slot is grouped under,
 * uses this zone. Pure module (no Node/Payload imports) so client components
 * and server code can share it.
 */
export const BOOKING_TIME_ZONE = 'Asia/Tokyo'

/** Asia/Tokyo has no DST, so a fixed offset is exact when turning a date-only boundary into an instant. */
export const BOOKING_UTC_OFFSET = '+09:00'

const PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOOKING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function bookingParts(iso: string): Record<string, string> {
  const parts: Record<string, string> = {}
  for (const part of PARTS_FORMATTER.formatToParts(new Date(iso))) {
    parts[part.type] = part.value
  }
  return parts
}

/** The booking-zone calendar date of an instant, "YYYY-MM-DD". */
export function toBookingDate(iso: string): string {
  const p = bookingParts(iso)
  return `${p['year']}-${p['month']}-${p['day']}`
}

/** The booking-zone wall-clock time of an instant, 24-hour "HH:MM". */
export function toBookingTime(iso: string): string {
  const p = bookingParts(iso)
  return `${p['hour']}:${p['minute']}`
}
