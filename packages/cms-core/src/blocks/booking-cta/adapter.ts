import type { BookingCtaBlockProps } from './types'

export function adaptBookingCtaBlock(raw: unknown): BookingCtaBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const buttonLabel = typeof data['buttonLabel'] === 'string' && data['buttonLabel'] ? data['buttonLabel'] : 'Book Appointment'

  return {
    buttonLabel,
    enabled: data['enabled'] === true,
    ...(typeof data['eyebrow'] === 'string' && data['eyebrow'] ? { eyebrow: data['eyebrow'] } : {}),
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['subheadline'] === 'string' && data['subheadline'] ? { subheadline: data['subheadline'] } : {}),
    ...(typeof data['note'] === 'string' && data['note'] ? { note: data['note'] } : {}),
    ...(typeof data['bookingProviderUrl'] === 'string' && data['bookingProviderUrl']
      ? { bookingProviderUrl: data['bookingProviderUrl'] }
      : {}),
  }
}
