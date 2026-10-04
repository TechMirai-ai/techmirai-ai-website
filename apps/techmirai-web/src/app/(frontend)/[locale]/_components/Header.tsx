// SERVER COMPONENT — do not add 'use client'
import siteConfig from '../../../../../site.config'
import { HeaderClient } from './HeaderClient'
import { resolveHeaderData } from './resolveHeaderData'

export interface ResolvedMegaColumnItem {
  label: string
  href: string
  description?: string | undefined
}

export interface ResolvedMegaColumn {
  heading?: string
  items?: ResolvedMegaColumnItem[]
}

export interface ResolvedNavChild {
  label: string
  href: string
}

export interface ResolvedNavItem {
  label: string
  href: string
  children?: ResolvedNavChild[]
  megaMenu?: boolean
  megaColumns?: ResolvedMegaColumn[]
  featuredImageUrl?: string | undefined
  featuredImageAlt?: string | undefined
}

export async function Header({ locale }: { locale: string }) {
  const { navItems, ctaLabel, ctaHref, cmsLogoUrl, phoneButton, lineButton } = await resolveHeaderData(locale)
  const localeLabels: Record<string, string> = { en: '🇺🇸', ja: '🇯🇵' }

  return (
    <HeaderClient
      navItems={navItems}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      locales={siteConfig.locales.enabled}
      localeLabels={localeLabels}
      locale={locale}
      cmsLogoUrl={cmsLogoUrl}
      phoneButton={phoneButton}
      lineButton={lineButton}
    />
  )
}