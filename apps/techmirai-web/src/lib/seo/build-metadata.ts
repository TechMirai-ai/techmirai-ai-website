import type { Metadata } from 'next'
import siteConfig from '../../../site.config'
import { LEGAL_PAGE_META, PAGE_META, type MetaLocale } from './page-meta'
import { VOICE_META } from './voice-meta'
import { OG_IMAGE_SIZE, isSeededPlaceholderImage, ogImageUrl } from './og-image'

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
  /**
   * Share-image URL chosen by an editor (CMS upload, post thumbnail). Without
   * one, the page's generated /og image is used (Pack-4/L2).
   */
  image?: string | undefined
  openGraph?: Metadata['openGraph']
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  noindex = false,
  image,
  openGraph,
}: PageMetadataInput): Metadata {
  const url = localizedUrl(path, locale)
  const shareImage = image ?? ogImageUrl(path, locale)
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
      ...(shareImage ? { images: [image ? shareImage : { url: shareImage, ...OG_IMAGE_SIZE, alt: title }] } : {}),
      ...openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description ? { description } : {}),
      ...(shareImage ? { images: [shareImage] } : {}),
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
  const metaTitle = usableDescription(meta['title'])
  const title =
    metaTitle
      ? metaTitle
      : typeof page['title'] === 'string' && page['title']
        ? page['title']
        : siteConfig.site.name
  const description = usableDescription(meta['description'])
  const image = meta['image'] as Record<string, unknown> | null | undefined
  // The seeded og-*.png placeholders (English-only labels) give way to the
  // generated per-locale image; a real editor upload still wins (Pack-4/L2).
  const imageUrl =
    image && typeof image['url'] === 'string' && !isSeededPlaceholderImage(image['filename'])
      ? image['url']
      : undefined

  return buildPageMetadata({
    locale,
    path,
    title,
    description,
    noindex: meta['noindex'] === true,
    image: imageUrl,
  })
}

/**
 * Metadata for a route whose copy is not CMS-driven: the Spec §17.1 row (or
 * the legal-page row) for `path`. Unknown locale → {} (the route 404s anyway).
 */
export function staticPageMetadata(path: string, locale: string, options: { noindex?: boolean } = {}): Metadata {
  // Voice-pivot rows win over the older Spec §17.1 rows (see voice-meta.ts).
  const row = VOICE_META[path] ?? PAGE_META[path] ?? LEGAL_PAGE_META[path]
  if (!row) throw new Error(`[seo] no Spec §17.1 row for ${path}`)
  if (locale !== 'en' && locale !== 'ja') return {}
  const { title, description } = row[locale as MetaLocale]
  return buildPageMetadata({ locale, path, title, description: usableDescription(description), ...options })
}

/**
 * A meta title or description still holding a bracketed marker ([TBD: …],
 * [JA TODO]) is not published: it is treated as absent, so the page title or
 * the site default description is used instead.
 */
function usableDescription(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text === '' || /\[[^\]\n]+\]/.test(text) ? undefined : text
}
