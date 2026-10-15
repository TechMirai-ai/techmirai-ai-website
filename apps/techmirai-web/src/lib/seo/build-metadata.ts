import type { Metadata } from 'next'
import siteConfig from '../../../site.config'
import { LEGAL_PAGE_META, PAGE_META, type MetaLocale } from './page-meta'

// Pack-4/L1: the one place that turns a locale-less path into URLs, so every
// page's canonical/hreflang tags and the sitemap agree. Japanese is the default
// locale and is served unprefixed (next-intl localePrefix 'as-needed'), so the
// "/ja" URL the Spec talks about is the unprefixed one (docs/FINDINGS.md
// 2026-10-14 L1 entry, Jamal's decision).

export const SITE_ORIGIN = `https://${siteConfig.site.domain}`

const DEFAULT_LOCALE = siteConfig.locales.default
const LOCALES = siteConfig.locales.enabled

/** Absolute URL for a locale-less path ('' = home) in one locale. */
export function localizedUrl(path: string, locale: string): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  const full = `${prefix}${path}`
  return `${SITE_ORIGIN}${full}`
}

/** hreflang map: every enabled locale plus x-default → the default-locale URL. */
export function hreflangAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, localizedUrl(path, l)])),
    'x-default': localizedUrl(path, DEFAULT_LOCALE),
  }
}

export interface PageMetadataInput {
  locale: string
  /** Locale-less path, '' for home. */
  path: string
  title: string
  description?: string | undefined
  noindex?: boolean
  openGraph?: Metadata['openGraph']
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  noindex = false,
  openGraph,
}: PageMetadataInput): Metadata {
  const url = localizedUrl(path, locale)
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url, languages: hreflangAlternates(path) },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url,
      siteName: siteConfig.site.name,
      locale,
      type: 'website',
      ...openGraph,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}

/**
 * Metadata for a `pages` collection document: its own `meta` group
 * (title → falls back to the page title; description; share image; the
 * generic `meta.noindex` switch, e.g. /thanks) plus canonical/hreflang.
 */
export function metadataFromPageDoc(
  page: Record<string, unknown>,
  locale: string,
  path: string,
): Metadata {
  const meta = (page['meta'] ?? {}) as Record<string, unknown>
  const title =
    typeof meta['title'] === 'string' && meta['title']
      ? meta['title']
      : typeof page['title'] === 'string' && page['title']
        ? page['title']
        : siteConfig.site.name
  const description = typeof meta['description'] === 'string' && meta['description'] ? meta['description'] : undefined
  const image = meta['image'] as Record<string, unknown> | null | undefined
  const imageUrl = image && typeof image['url'] === 'string' ? image['url'] : undefined

  return buildPageMetadata({
    locale,
    path,
    title,
    description,
    noindex: meta['noindex'] === true,
    ...(imageUrl ? { openGraph: { images: [imageUrl] } } : {}),
  })
}

/**
 * Metadata for a route whose copy is not CMS-driven: the Spec §17.1 row (or
 * the legal-page row) for `path`. Unknown locale → {} (the route 404s anyway).
 */
export function staticPageMetadata(path: string, locale: string, options: { noindex?: boolean } = {}): Metadata {
  const row = PAGE_META[path] ?? LEGAL_PAGE_META[path]
  if (!row) throw new Error(`[seo] no Spec §17.1 row for ${path}`)
  if (locale !== 'en' && locale !== 'ja') return {}
  const { title, description } = row[locale as MetaLocale]
  return buildPageMetadata({ locale, path, title, description, ...options })
}
