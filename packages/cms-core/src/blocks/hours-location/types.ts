export interface HoursLocationBlockProps {
  sectionHeading?: string
  showMap: boolean
  showHours: boolean
  showAddress: boolean
  showPhone: boolean
  // Sourced from SiteConfig.contact — see config.ts field descriptions. Injected
  // by the consuming app's page renderer (blocks have no direct siteConfig access),
  // the same way news-list's `resolvedItems` fallback is injected.
  address?: string
  phone?: string
  mapEmbedUrl?: string
  businessHours?: Record<string, string>
}
