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
}
