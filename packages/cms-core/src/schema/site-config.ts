import { z } from 'zod'

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const socialPlatformSchema = z.enum([
  'twitter',
  'facebook',
  'linkedin',
  'instagram',
  'line',
  'youtube',
])

const socialLinkSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string(),
})

const brandColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  muted: z.string(),
  error: z.string(),
  success: z.string(),
  warning: z.string(),
  surfaceAlt: z.string().optional(),
  surfaceSubtle: z.string().optional(),
  surfaceFaint: z.string().optional(),
  textSecondary: z.string().optional(),
  headingDark: z.string().optional(),
  deepAccent: z.string().optional(),
  iconAccent: z.string().optional(),
  buttonAccent: z.string().optional(),
  buttonAccentHover: z.string().optional(),
  priceHighlight: z.string().optional(),
})

const perLocaleTypographySchema = z.object({
  fontSans: z.string().optional(),
  fontSerif: z.string().optional(),
})

const typographySchema = z.object({
  fontSans: z.string(),
  fontSerif: z.string().optional(),
  fontMono: z.string().optional(),
  fontSizeBase: z.string(),
  fontWeightHeading: z.string(),
  fontWeightBody: z.string(),
  perLocale: z.record(z.string(), perLocaleTypographySchema).optional(),
})

const brandSchema = z.object({
  logoFile: z.string(),
  faviconFile: z.string(),
  ogImageFile: z.string(),
  brandMark: z.string().optional(),
  colors: brandColorsSchema,
  typography: typographySchema,
})

const localesSchema = z.object({
  enabled: z.array(z.string()).min(1),
  default: z.string(),
  direction: z.record(z.string(), z.enum(['ltr', 'rtl'])),
})

const featuresSchema = z.object({
  aiAgent: z.boolean(),
  bookingWidget: z.boolean(),
  jobListings: z.boolean(),
  events: z.boolean(),
  seminars: z.boolean(),
  gallery: z.boolean(),
  testimonials: z.boolean(),
  downloads: z.boolean(),
  news: z.boolean(),
  team: z.boolean(),
  locations: z.boolean(),
  services: z.boolean(),
  caseStudies: z.boolean(),
  blog: z.boolean(),
  company: z.boolean(),
  recruit: z.boolean(),
  faq: z.boolean(),
  contact: z.boolean(),
  about: z.boolean(),
})

const verticalsSchema = z.object({
  recruitment: z.boolean(),
  clinic: z.boolean(),
})

const navSchema = z.object({
  legalLinks: z.array(
    z.object({
      slug: z.string(),
      labelKey: z.string(),
    }),
  ),
  socialLinks: z.array(socialLinkSchema),
})

const contactSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.record(z.string(), z.string()).optional(),
  mapEmbedUrl: z.string().optional(),
  businessHours: z.record(z.string(), z.string()).optional(),
})

const formsSchema = z.object({
  contactRecipient: z.string().email(),
  jobApplicationRecipient: z.string().email().optional(),
  appointmentRecipient: z.string().email().optional(),
})

const legalSchema = z.object({
  privacyPolicySlug: z.string(),
  termsSlug: z.string().optional(),
  cookiePolicySlug: z.string().optional(),
})

const seoSchema = z.object({
  titleTemplate: z.string(),
  defaultDescription: z.record(z.string(), z.string()),
  robotsTxt: z.string().optional(),
  sitemapIncludeCollections: z.array(z.string()),
})

const chatWidgetSchema = z.object({
  url: z.string(),
  whatsappNumber: z.string(),
  avatarUrl: z.string(),
  color: z.string(),
})

const notificationsSchema = z.object({
  reminderHourLocal: z.number().int().min(0).max(23),
})

const bookingSchema = z.object({
  // How many hours before the appointment a customer can still self-service
  // cancel/reschedule online. Enforced server-side (booking/api/cutoff.ts),
  // not just as a UI hint — past this, the manage page shows contact.phone
  // instead of the cancel/reschedule buttons.
  cancellationCutoffHours: z.number().int().min(0),
})

const receptionSchema = z.object({
  enabled: z.boolean(),
  // Per-locale greeting shown when the reception widget opens, same shape as
  // site.tagline — host-configurable copy, not an i18n key, since it varies
  // per deployment.
  greeting: z.record(z.string(), z.string()),
  openDelayMs: z.number().int().min(0),
  // Which of the app's locales the reception flow is available in — may be a
  // subset of locales.enabled.
  locales: z.array(z.string()).min(1),
  // Fallback number surfaced on the refusal path ("please ask the
  // practitioner directly") and other system-copy contexts.
  clinicPhone: z.string(),
  // Outbound LINE add-friend/chat URL for the FAQ menu's "Talk to staff"
  // option — a plain link out to the clinic's own LINE account, not the
  // booking/notification LINE integration configured via LINE_* env vars.
  // Optional: a client who hasn't provided theirs yet simply doesn't see the
  // option (see useReceptionEngine's staffLineUrl handling) rather than
  // getting a dead link.
  staffLineUrl: z.string().optional(),
})

const integrationsSchema = z.object({
  googleAnalyticsId: z.string().optional(),
  turnstileSiteKey: z.string().optional(),
  resendFromEmail: z.string().email(),
  bookingProviderUrl: z.string().optional(),
  mapsApiKey: z.string().optional(),
  chatWidget: chatWidgetSchema.optional(),
})

// ---------------------------------------------------------------------------
// Root schema
// ---------------------------------------------------------------------------

export const siteConfigSchema = z.object({
  site: z.object({
    name: z.string().min(1),
    tagline: z.record(z.string(), z.string()),
    domain: z.string().min(1),
  }),
  brand: brandSchema,
  locales: localesSchema,
  features: featuresSchema,
  verticals: verticalsSchema,
  nav: navSchema,
  contact: contactSchema,
  forms: formsSchema,
  legal: legalSchema,
  seo: seoSchema,
  integrations: integrationsSchema,
  notifications: notificationsSchema,
  booking: bookingSchema,
  reception: receptionSchema,
})

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type SiteConfig = z.infer<typeof siteConfigSchema>
export type SocialPlatform = z.infer<typeof socialPlatformSchema>
export type SocialLink = z.infer<typeof socialLinkSchema>
export type SiteFeatures = z.infer<typeof featuresSchema>

export interface NavItem {
  labelKey: string
  href: string
  children?: NavItem[]
}
