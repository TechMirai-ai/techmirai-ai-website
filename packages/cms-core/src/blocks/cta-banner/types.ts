// Canonical values: solid | gradient | image
// Legacy values kept for backwards compat with existing page-level inline props
export type CTABannerVariant = 'solid' | 'gradient' | 'image' | 'filled' | 'outlined' | 'image-bg'

export type CTABannerBackgroundStyle = 'brand' | 'dark' | 'light'
export type CTABannerButtonVariant = 'solid' | 'outline'
export type CTABannerLayout = 'centered' | 'split'

export interface CTABannerCta {
  label: string
  href: string
}

export interface CTABannerContactStrip {
  phone: string
  email: string
  hours: string
}

export interface CTABannerBlockProps {
  eyebrow?: string
  heading: string
  body?: string
  primaryButton: CTABannerCta
  primaryButtonVariant?: CTABannerButtonVariant
  secondaryButton?: CTABannerCta
  secondaryButtonVariant?: CTABannerButtonVariant
  variant?: CTABannerVariant
  backgroundStyle?: CTABannerBackgroundStyle
  backgroundImageUrl?: string
  layout?: CTABannerLayout
  textLink?: CTABannerCta
  showContactStrip?: boolean
  // Injected by the consuming app's page renderer from SiteConfig.contact —
  // see packages/cms-core/src/blocks/cta-banner/adapter.ts.
  contactStrip?: CTABannerContactStrip
}
