export interface BookingCtaBlockProps {
  eyebrow?: string
  heading?: string
  subheadline?: string
  buttonLabel: string
  note?: string
  // Injected by the consuming app's page renderer from SiteConfig — see
  // packages/cms-core/src/blocks/booking-cta/adapter.ts.
  bookingProviderUrl?: string
  enabled: boolean
}
