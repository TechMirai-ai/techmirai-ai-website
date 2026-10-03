import type { Block } from 'payload'

// Reads SiteConfig.integrations.bookingProviderUrl at render time (injected by the
// consuming app's page renderer, same pattern as hours-location) — this block links
// out to an external booking provider. It does not implement scheduling itself.
// Not clinic-specific: features.bookingWidget/integrations.bookingProviderUrl are
// core SiteConfig fields any vertical (salons, clinics, tutoring, ...) can use.
export const BookingCtaBlockConfig: Block = {
  slug: 'booking-cta',
  interfaceName: 'BookingCtaBlock',
  labels: { singular: 'Booking CTA', plural: 'Booking CTAs' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'subheadline', type: 'textarea', localized: true },
    {
      name: 'buttonLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Book Appointment',
    },
    {
      name: 'note',
      type: 'text',
      localized: true,
      admin: { description: 'e.g. "You will be redirected to our booking partner"' },
    },
  ],
}
