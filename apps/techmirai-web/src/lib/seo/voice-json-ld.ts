import siteConfig from '../../../site.config'
import { SITE_ORIGIN } from './build-metadata'
import { breadcrumbJsonLd, stripBracketed, type JsonLd } from './json-ld'
import type { MetaLocale } from './page-meta'

// Voice-pivot structured data (docs/ECC MASTER PROMPT TechMirai Voice Website
// v2 §12): only schema types that are true and present — Service,
// ContactPoint, BreadcrumbList. No FAQPage, Article, reviews, ratings, prices,
// awards or VideoObject (no such content exists). Bracketed values are
// stripped by stripBracketed, so unconfirmed facts never reach the output.
// Organization and WebSite stay in json-ld.ts (guarded by its own tests).

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`

const SERVICE_NAME: Readonly<Record<MetaLocale, string>> = {
  en: 'TechMirai AI voice agent',
  ja: 'コールセンター・電話窓口向け AI音声エージェント',
}

const SERVICE_DESCRIPTION: Readonly<Record<MetaLocale, string>> = {
  en: 'An AI voice agent for call centers and phone desks. It gives first-line response to routine, busy-time and after-hours calls, records and summarizes them, and passes what needs a person to staff. Offered to call centers as a white-label service.',
  ja: '定型的な問い合わせ・混雑時・営業時間外の電話にAIが一次対応し、通話を記録・要約して、必要な対応はスタッフへ。コールセンター事業者様は、自社サービスとして提供できます。',
}

const HOME_LABEL: Readonly<Record<MetaLocale, string>> = { en: 'Home', ja: 'ホーム' }

/** Page names for breadcrumbs. Japanese stays absent until supplied ([JA TODO]). */
const LAUNCH_PAGE_NAMES: Readonly<Record<string, Partial<Record<MetaLocale, string>>>> = {
  '/demo': { en: 'Demo', ja: 'デモ' },
  '/partners': { en: 'Partners', ja: 'パートナー' },
  '/company': { en: 'Company', ja: '会社情報' },
  '/contact': { en: 'Contact', ja: 'お問い合わせ' },
  '/privacy': { en: 'Privacy Policy', ja: 'プライバシーポリシー' },
}

export function voiceServiceJsonLd(locale: MetaLocale): JsonLd {
  return stripBracketed({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: SERVICE_NAME[locale],
    serviceType: 'AI voice agent for call centers and phone desks',
    description: SERVICE_DESCRIPTION[locale],
    provider: { '@id': ORGANIZATION_ID },
    areaServed: 'JP',
    audience: { '@type': 'BusinessAudience', audienceType: 'Call centers and BPO operators' },
  })
}

/** ContactPoint attached to the existing Organization node by @id; null when no confirmed email. */
export function contactPointJsonLd(): JsonLd | null {
  const email = siteConfig.contact.email
  if (!email) return null
  const node = stripBracketed({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email,
      availableLanguage: ['ja', 'en'],
    },
  })
  return node['contactPoint'] ? node : null
}

/** Home → page breadcrumb for a launch page, or null when the page name is not available in this locale. */
export function launchBreadcrumbJsonLd(locale: MetaLocale, path: string): JsonLd | null {
  const name = LAUNCH_PAGE_NAMES[path]?.[locale]
  if (!name) return null
  return breadcrumbJsonLd(locale, [
    { path: '', name: HOME_LABEL[locale] },
    { path, name },
  ])
}
