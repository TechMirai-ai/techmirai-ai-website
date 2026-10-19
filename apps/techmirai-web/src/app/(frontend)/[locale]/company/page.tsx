import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import siteConfig from '../../../../../site.config'
import { getCachedPayload } from '@/lib/payload'
import { HeroBlock, CTABannerBlock } from '@techmirai/cms-core/blocks'
import type { HeroBlockProps, CTABannerBlockProps } from '@techmirai/cms-core/blocks'
import {

  Container,
  Section,
  Heading,
  Card,
  Text,
} from '@techmirai/cms-core/components/ui'

export const revalidate = 3600

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

type Props = { params: Promise<{ locale: string }> }

type LocaleGroup = { en?: string; ja?: string }
type Executive = { name?: string; role?: LocaleGroup }
type TimelineItem = { year?: number; label?: LocaleGroup; description?: LocaleGroup }

type CompanyInfoDoc = {
  legalName?: string
  foundedYear?: number
  capital?: string
  employeeCount?: number
  description?: LocaleGroup
  mission?: LocaleGroup
  vision?: LocaleGroup
  address?: LocaleGroup
  businessHours?: LocaleGroup
  executives?: Executive[]
  timeline?: TimelineItem[]
}

function txt(field: LocaleGroup | undefined, locale: Locale): string | undefined {
  if (!field) return undefined
  return field[locale] ?? field.en ?? undefined
}

const getCompanyInfo = unstable_cache(
  async () => {
    const payload = await getCachedPayload()
    const raw = await payload.findGlobal({ slug: 'company-info' })
    return raw as unknown as CompanyInfoDoc
  },
  ['company-info-global'],
  { tags: ['company'] },
)

export function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

const titles: Record<Locale, string> = { en: 'Company Profile', ja: '会社概要' }
const descriptions: Record<Locale, string> = {
  en: `Learn about ${siteConfig.site.name} — our mission, history, and the team behind Japan's international workforce solutions.`,
  ja: `${siteConfig.site.name}のミッション・沿革・日本の外国人雇用支援を担うチームをご紹介します。`,
}
const homeLabels: Record<Locale, string> = { en: 'Home', ja: 'ホーム' }
const heroSubheadings: Record<Locale, string> = {
  en: 'Bridging global talent with Japanese employers since 2018.',
  ja: '2018年より、グローバルな人材と日本企業を繋ぎ続けています。',
}
const missionLabels: Record<Locale, string> = { en: 'Our Mission', ja: 'ミッション' }
const visionLabels: Record<Locale, string> = { en: 'Our Vision', ja: 'ビジョン' }
const historyLabels: Record<Locale, string> = { en: 'Our History', ja: '沿革' }
const leadershipLabels: Record<Locale, string> = { en: 'Leadership', ja: '経営陣' }
const foundedLabels: Record<Locale, string> = { en: 'Founded', ja: '設立' }
const capitalLabels: Record<Locale, string> = { en: 'Capital', ja: '資本金' }
const employeesLabels: Record<Locale, string> = { en: 'Employees', ja: '従業員数' }
const hqLabels: Record<Locale, string> = { en: 'Headquarters', ja: '本社' }
const ctaHeadings: Record<Locale, string> = {
  en: 'Ready to work with us?', ja: '私たちと一緒に始めませんか？',
}
const ctaButtons: Record<Locale, string> = { en: 'Get in Touch', ja: 'お問い合わせ' }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const base = `https://${siteConfig.site.domain}`
  const defaultLocale = siteConfig.locales.default
  const canonicalPath = locale === defaultLocale ? '/company' : `/${locale}/company`
  const languages: Record<string, string> = { 'x-default': `${base}/company` }
  for (const loc of siteConfig.locales.enabled) {
    languages[loc] = loc === defaultLocale ? `${base}/company` : `${base}/${loc}/company`
  }
  return {
    title: titles[locale],
    description: descriptions[locale],
    openGraph: { title: titles[locale], description: descriptions[locale], url: `${base}${canonicalPath}`, siteName: siteConfig.site.name, locale, type: 'website' },
    alternates: { canonical: `${base}${canonicalPath}`, languages },
    // Not a Spec §4 page (O1): reachable, never indexed.
    robots: { index: false, follow: false },
  }
}

export default async function CompanyPage({ params }: Props) {
  if (!siteConfig.features.company) notFound()
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const info = await getCompanyInfo()
  const base = `https://${siteConfig.site.domain}`
  const defaultLocale = siteConfig.locales.default
  const homeUrl = locale === defaultLocale ? base : `${base}/${locale}`
  const pageUrl = locale === defaultLocale ? `${base}/company` : `${base}/${locale}/company`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabels[locale], item: homeUrl },
      { '@type': 'ListItem', position: 2, name: titles[locale], item: pageUrl },
    ],
  }

  const organizationJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: info.legalName ?? siteConfig.site.name, url: base,
    ...(info.foundedYear ? { foundingDate: String(info.foundedYear) } : {}),
    ...(txt(info.description, locale) ? { description: txt(info.description, locale) } : {}),
    ...(info.employeeCount != null ? { numberOfEmployees: { '@type': 'QuantitativeValue', value: info.employeeCount } } : {}),
    ...(info.executives && info.executives.length > 0
      ? { founder: info.executives.map((e) => ({ '@type': 'Person', name: e.name ?? '', ...(txt(e.role, locale) ? { jobTitle: txt(e.role, locale) } : {}) })) }
      : {}),
  }

  const heroProps: HeroBlockProps = {
    heading: info.legalName ?? titles[locale],
    subheading: txt(info.description, locale) ?? heroSubheadings[locale],
    overlayOpacity: 40, variant: 'center', minHeight: 'medium', transparentHeader: false,
  }

  const ctaProps: CTABannerBlockProps = {
    heading: ctaHeadings[locale],
    primaryButton: { label: ctaButtons[locale], href: '/contact' },
    variant: 'filled',
  }

  const sortedTimeline = [...(info.timeline ?? [])].sort((a, b) => (a.year ?? 0) - (b.year ?? 0))

  const facts = [
    { label: foundedLabels[locale], value: info.foundedYear ? String(info.foundedYear) : null },
    { label: capitalLabels[locale], value: info.capital ?? null },
    { label: employeesLabels[locale], value: info.employeeCount != null ? String(info.employeeCount) : null },
    { label: hqLabels[locale], value: txt(info.address, locale) ?? null },
  ].filter((f): f is { label: string; value: string } => f.value !== null)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      
      {facts.length > 0 && (
        <Section padding="sm">
          <Container>
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="text-center">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-1">{f.label}</dt>
                  <dd className="text-lg font-bold text-[var(--color-text)]">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      )}

      {(txt(info.mission, locale) || txt(info.vision, locale)) && (
        <Section>
          <Container>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {txt(info.mission, locale) && (
                <Card className="p-8">
                  <Heading level={3} className="text-base font-semibold text-[var(--color-primary)] mb-3">{missionLabels[locale]}</Heading>
                  <Text className="text-sm leading-relaxed">{txt(info.mission, locale)}</Text>
                </Card>
              )}
              {txt(info.vision, locale) && (
                <Card className="p-8">
                  <Heading level={3} className="text-base font-semibold text-[var(--color-primary)] mb-3">{visionLabels[locale]}</Heading>
                  <Text className="text-sm leading-relaxed">{txt(info.vision, locale)}</Text>
                </Card>
              )}
            </div>
          </Container>
        </Section>
      )}

      {sortedTimeline.length > 0 && (
        <Section>
          <Container>
            <Heading level={2} className="text-2xl font-semibold mb-10 text-center">{historyLabels[locale]}</Heading>
            <ol className="relative border-l border-neutral-200 space-y-8 ml-4">
              {sortedTimeline.map((item, i) => (
                <li key={i} className="ml-6">
                  <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] ring-4 ring-white" />
                  <Text className="text-xs font-semibold text-[var(--color-primary)] mb-0.5">{item.year}</Text>
                  <Heading level={4} className="text-sm font-semibold mb-1">{txt(item.label, locale)}</Heading>
                  <Text className="text-sm text-[var(--color-muted)]">{txt(item.description, locale)}</Text>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {info.executives && info.executives.length > 0 && (
        <Section>
          <Container>
            <Heading level={2} className="text-2xl font-semibold mb-8 text-center">{leadershipLabels[locale]}</Heading>
            <ul role="list" className="flex flex-wrap justify-center gap-6">
              {info.executives.map((exec, i) => (
                <li key={i}>
                  <Card className="p-6 text-center min-w-[180px]">
                    <Heading level={4} className="text-sm font-semibold mb-1">{exec.name}</Heading>
                    <Text className="text-xs text-[var(--color-muted)]">{txt(exec.role, locale)}</Text>
                  </Card>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

    </>
  )
}
