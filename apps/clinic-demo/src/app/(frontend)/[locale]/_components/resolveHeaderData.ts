// resolveHeaderData.ts — same folder as Header.tsx
import { cache } from 'react'
import { getCachedPayload } from '@/lib/payload'
import siteConfig from '../../../../../site.config'
import type { ResolvedNavItem, ResolvedMegaColumn } from './Header'

interface NavChild {
  label: string | Record<string, string>
  href: string
}

interface MegaColumnItem {
  label: string | Record<string, string>
  href: string
  description?: string | Record<string, string>
}

interface MegaColumn {
  heading?: string | Record<string, string>
  items?: MegaColumnItem[]
}

interface PayloadMedia {
  id: string
  url?: string
  alt?: string
  [key: string]: any
}

interface NavItem {
  label: string | Record<string, string>
  href: string
  children?: NavChild[]
  megaMenu?: boolean
  megaColumns?: MegaColumn[]
  featuredImage?: string | PayloadMedia
}

interface HeaderGlobalData {
  navItems?: NavItem[]
  ctaButton?: { label?: string | Record<string, string>; href?: string }
  logo?: string | PayloadMedia
  phoneButton?: PhoneButtonData
  lineButton?: LineButtonData
}
interface PhoneButtonData {
  phoneDisplay: string
  phoneHref: string
  badgeLabel?: string | Record<string, string>
  subLabel?: string | Record<string, string>
}

interface LineButtonData {
  href: string
  label?: string | Record<string, string>
  subLabel?: string | Record<string, string>
}

export const resolveHeaderData = cache(async (locale: string) => {
  const payload = await getCachedPayload()

  let headerData: HeaderGlobalData = {}
  try {
    const raw = await payload.findGlobal({
      slug: 'header',
      locale: locale as 'en' | 'ja',
      depth: 1,
    })
    headerData = raw as HeaderGlobalData
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Header] CMS unavailable:', err)
  }

  const resolve = (value: string | Record<string, string> | undefined): string => {
    if (!value) return ''
    if (typeof value === 'string') {
      if (value.trim().startsWith('{')) {
        try { const p = JSON.parse(value); return p[locale] || p[siteConfig.locales.default] || '' } catch { return value }
      }
      return value
    }
    return value[locale] || value[siteConfig.locales.default] || ''
  }

  let cmsLogoUrl: string | null = null
  if (headerData.logo && typeof headerData.logo === 'object') {
    cmsLogoUrl = headerData.logo.url || null
  }

  const resolvedNavItems: ResolvedNavItem[] = (headerData.navItems ?? []).map((item) => {
    const resolved: ResolvedNavItem = { label: resolve(item.label), href: item.href }

    if (item.featuredImage && typeof item.featuredImage === 'object') {
      resolved.featuredImageUrl = item.featuredImage.url || undefined
      resolved.featuredImageAlt = item.featuredImage.alt || undefined
    }
    if (item.children?.length) {
      resolved.children = item.children.map((c) => ({ label: resolve(c.label), href: c.href }))
    }
    if (item.megaMenu) resolved.megaMenu = true
    if (item.megaColumns?.length) {
      resolved.megaColumns = item.megaColumns.map((col) => {
        const column: ResolvedMegaColumn = {}
        if (col.heading) column.heading = resolve(col.heading)
        if (col.items?.length) {
          column.items = col.items.map((i) => ({
            label: resolve(i.label), href: i.href, description: resolve(i.description),
          }))
        }
        return column
      })
    }
    return resolved
  })

  const phoneButton = headerData.phoneButton
  ? {
      phoneDisplay: headerData.phoneButton.phoneDisplay,
      phoneHref: headerData.phoneButton.phoneHref,
      badgeLabel: resolve(headerData.phoneButton.badgeLabel),
      subLabel: resolve(headerData.phoneButton.subLabel),
    }
  : undefined

const lineButton = headerData.lineButton
  ? {
      href: headerData.lineButton.href,
      label: resolve(headerData.lineButton.label),
      subLabel: resolve(headerData.lineButton.subLabel),
    }
  : undefined

  return {
  navItems: resolvedNavItems,
  ctaLabel: resolve(headerData.ctaButton?.label),
  ctaHref: headerData.ctaButton?.href ?? '/contact',
  cmsLogoUrl,
  phoneButton,
  lineButton,
}
})