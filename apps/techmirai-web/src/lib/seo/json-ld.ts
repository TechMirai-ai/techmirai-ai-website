import siteConfig from '../../../site.config'
import { SITE_ORIGIN, localizedUrl } from './build-metadata'
import type { MetaLocale } from './page-meta'

// Pack-4/L2: schema.org JSON-LD builders (Spec §17.3). Values come from
// site.config or from the Spec itself; every value the Spec shows in
// [brackets] is OMITTED from the output, never shown (stripBracketed below),
// and each omission has a docs/PLACEHOLDER-REGISTER.md L2-* row.

export type JsonLd = Record<string, unknown>

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`
const WEBSITE_ID = `${SITE_ORIGIN}/#website`
const BRACKETED = /\[[^\]]*\]/

/**
 * Spec §17.4 canonical company-facts sentences 1–2, verbatim, used as the
 * Organization description (Jamal, 2026-10-15). Spec §17.3's own example
 * description is a different sentence — conflict logged in docs/FINDINGS.md.
 */
export const ORGANIZATION_DESCRIPTION: Readonly<Record<MetaLocale, string>> = {
  en: 'TechMirai is a Japan-based company that builds AI受付, an AI reception system for small businesses. AI受付 turns a business’s website into a 24/7 front desk that answers questions, takes reservations, connects with LINE and hands customers to staff.',
  ja: 'TechMiraiは、中小企業・店舗のためのAI受付システム「AI受付」を開発する、日本を拠点とした事業者です。AI受付は、お店のホームページを、質問への回答、予約の受付、LINE連携、スタッフへの引き継ぎを24時間行う受付に変えます。',
}

/** Breadcrumb names: the Spec §4 page titles. */
export const BREADCRUMB_LABELS: Readonly<Record<string, Record<MetaLocale, string>>> = {
  '': { en: 'Home', ja: 'ホーム' },
  '/solutions': { en: 'Solutions', ja: '業種別の活用' },
  '/solutions/clinic': { en: 'Clinics & treatment rooms', ja: 'クリニック・治療院' },
  '/solutions/beauty': { en: 'Beauty salons', ja: '美容サロン' },
  '/solutions/automobile': { en: 'Auto service & dealers', ja: '自動車整備・販売' },
  '/solutions/hotel': { en: 'Hotels & guesthouses', ja: 'ホテル・宿泊施設' },
  '/blog': { en: 'Insights', ja: 'コラム' },
  '/case-studies/sadiatec': { en: 'Case study: Sadiatec', ja: '導入事例：Sadiatec様' },
}

function isEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    return keys.length === 0 || (keys.length === 1 && keys[0] === '@type')
  }
  return value === undefined || value === null || value === ''
}

/**
 * Returns a copy with every bracketed string removed, then any array/object
 * left empty (or holding only `@type`) removed too. Never mutates its input.
 */
export function stripBracketed<T>(value: T): T {
  if (typeof value === 'string') return (BRACKETED.test(value) ? undefined : value) as T
  if (Array.isArray(value)) {
    return value.map((v) => stripBracketed(v)).filter((v) => !isEmpty(v)) as T
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, stripBracketed(v)] as const)
      .filter(([, v]) => !isEmpty(v))
    return Object.fromEntries(entries) as T
  }
  return value
}

export interface OrganizationInput {
  locale: MetaLocale
  /** Founder name, only when company-info `founder.visible` is on. */
  founderName?: string | undefined
}

export function organizationJsonLd({ locale, founderName }: OrganizationInput): JsonLd {
  const { contact } = siteConfig
  return stripBracketed({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: siteConfig.site.name,
    alternateName: ['TechMirai AI', '[テックミライ]'],
    url: `${SITE_ORIGIN}/`,
    // logo omitted: the Spec's path is bracketed and the current logo is the
    // placeholder wordmark (PLACEHOLDER-REGISTER D2-02) — Jamal, 2026-10-15.
    description: ORGANIZATION_DESCRIPTION[locale],
    email: contact.email,
    telephone: contact.phone,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      streetAddress: contact.address?.[locale],
    },
    ...(founderName ? { founder: { '@type': 'Person', name: founderName } } : {}),
    areaServed: 'JP',
    knowsLanguage: ['ja', 'en'],
    sameAs: ['[LINE Official Account URL]', '[company social profile URLs]'],
  })
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_ORIGIN}/`,
    name: siteConfig.site.name,
    inLanguage: ['ja', 'en'],
    publisher: { '@id': ORGANIZATION_ID },
  }
}

/** Spec §17.3 Service block for /ai-reception and /pricing. */
export function serviceJsonLd(): JsonLd {
  const minPrice = '[300000]'
  const offerDescription = 'AI受付 Starter Package: initial setup from [¥300,000]; monthly from [¥30,000].'
  // The whole offer is omitted while its price is bracketed: a priceless
  // PriceSpecification would be a placeholder in all but name (L2-02).
  const offers = BRACKETED.test(minPrice)
    ? undefined
    : {
        '@type': 'Offer',
        priceSpecification: { '@type': 'PriceSpecification', minPrice, priceCurrency: 'JPY' },
        description: offerDescription,
      }
  return stripBracketed({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'TechMirai AI受付',
    serviceType: 'AI reception system for websites and LINE',
    provider: { '@id': ORGANIZATION_ID },
    areaServed: 'JP',
    ...(offers ? { offers } : {}),
  })
}

export interface FaqItem {
  question: string
  answer: string
}

/** Spec §17.3 FAQPage — only for questions actually displayed on the page. */
export function faqPageJsonLd(items: readonly FaqItem[]): JsonLd {
  return stripBracketed({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  })
}

export interface BlogPostingInput {
  locale: MetaLocale
  slug: string
  headline: string
  datePublished?: string | undefined
  dateModified?: string | undefined
  authorName?: string | undefined
}

export function blogPostingJsonLd(post: BlogPostingInput): JsonLd {
  return stripBracketed({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    inLanguage: post.locale,
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    ...(post.authorName ? { author: { '@type': 'Person', name: post.authorName } } : {}),
    publisher: { '@id': ORGANIZATION_ID },
    mainEntityOfPage: localizedUrl(`/blog/${post.slug}`, post.locale),
  })
}

export interface BreadcrumbItem {
  /** Locale-less path ('' = home). */
  path: string
  /** Defaults to the Spec §4 label for `path`. */
  name?: string
}

export function breadcrumbJsonLd(locale: MetaLocale, items: readonly BreadcrumbItem[]): JsonLd {
  return stripBracketed({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name ?? BREADCRUMB_LABELS[item.path]?.[locale],
      item: localizedUrl(item.path, locale),
    })),
  })
}
