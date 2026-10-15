import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/build-metadata'
import { notFound } from 'next/navigation'
import siteConfig from '../../../../../site.config'
import { PageHeroBlock, ProcessStepsBlock } from '@techmirai/cms-core/blocks'
import { Container, Section, Heading, Text, Card, Badge } from '@techmirai/cms-core/components/ui'
import { AssessmentForm } from './_components/AssessmentForm'

// Pack-4/J1: /assessment (Spec §12.1-12.2, pp.64-68). Hand-built dedicated
// route, same pattern as /contact/page.tsx — not the generic
// `[locale]/[slug]/page.tsx` catch-all, since this page's copy is entirely
// fixed by the Spec and isn't meant to be edited per-field in the CMS.
// Every string below is copied verbatim from the Spec; brackets ([3
// business days]/[3営業日]) are kept exactly as written per CLAUDE.md rule
// 5. Reuses `PageHeroBlock`/`ProcessStepsBlock` as plain React components
// with hardcoded props (same technique /contact/page.tsx already uses for
// `PageHeroBlock`/`CTABannerBlock`) rather than inventing new ones;
// `LabelValueListBlock`'s component is not re-exported from
// `@techmirai/cms-core/blocks` (only its Payload config is), so the sample
// report card below is plain JSX instead.

export const revalidate = 3600

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

type Props = { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

// ---------------------------------------------------------------------------
// Spec §12.1 copy, verbatim
// ---------------------------------------------------------------------------

const titles: Record<Locale, string> = {
  en: 'Free AI Website Assessment',
  ja: '無料AIホームページ診断',
}

const subs: Record<Locale, string> = {
  en:
    'Send us your website address. Within [3 business days], we will send a short report showing what AI受付 could handle for your business — and what your staff should keep.',
  ja:
    'ホームページのURLをお送りください。[3営業日]以内に、AI受付で対応できること、スタッフが担うべきことをまとめた簡単なレポートをお送りします。',
}

const trustLines: Record<Locale, string> = {
  en: 'Free · No obligation · No pushy follow-up · Japanese or English',
  ja: '無料・ご契約の義務なし・しつこい営業はいたしません・日本語／英語',
}

const sampleBadgeLabels: Record<Locale, string> = { en: 'Sample', ja: 'サンプル' }

const sampleReportHeadings: Record<Locale, string> = {
  en: 'What you receive',
  ja: 'お渡しするもの',
}

const sampleReportItems: Record<Locale, string[]> = {
  en: [
    'Current website: what it does today (for example, static information only)',
    'AI FAQ: which questions AI受付 could answer',
    'Reservation: whether online or LINE booking fits, and how it would connect',
    'LINE integration',
    'Multilingual support',
    'Social media customer journey',
    'Automated inquiry handling',
    'Handoff to staff: what your staff should keep',
  ],
  ja: [
    '現在のホームページ：今できていること（例：情報の掲載のみ）',
    'AIによるよくある質問対応：AI受付で回答できる質問',
    '予約：オンライン予約やLINE予約が合うか、どうつなぐか',
    'LINE連携',
    '多言語対応',
    'SNSからの導線',
    'お問い合わせの自動対応',
    'スタッフへの引き継ぎ：スタッフが担うべきこと',
  ],
}

const nextStepsHeadings: Record<Locale, string> = {
  en: 'What happens next',
  ja: '次に起こること',
}

const nextSteps: Record<Locale, string[]> = {
  en: [
    'Send your URL (about 1 minute)',
    'We review your website',
    'You receive the report by email or LINE',
    'Optional 30-minute online call to go through it',
  ],
  ja: [
    'URLを送信（約1分）',
    'ホームページを拝見します',
    'メールまたはLINEでレポートをお届けします',
    'ご希望の方は、30分のオンライン面談でご説明します',
  ],
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return staticPageMetadata('/assessment', locale)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AssessmentPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <>
      <PageHeroBlock variant="hero" heading={titles[locale]} body={subs[locale]} textAlignment="left" />

      <Section>
        <Container>
          <Text className="mb-10 text-center text-sm font-medium text-text-muted">{trustLines[locale]}</Text>

          <div className="mx-auto mb-16 max-w-2xl">
            <Card className="p-6">
              <Badge variant="accent">{sampleBadgeLabels[locale]}</Badge>
              <Heading level={3} className="mt-3 mb-4 text-xl">
                {sampleReportHeadings[locale]}
              </Heading>
              <ul className="list-inside list-disc space-y-2 text-sm text-text-secondary">
                {sampleReportItems[locale].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </Section>

      <ProcessStepsBlock heading={nextStepsHeadings[locale]} steps={nextSteps[locale].map((line) => ({ line }))} />

      <Section>
        <Container>
          <div id="assessment-form" className="mx-auto max-w-2xl">
            <AssessmentForm locale={locale} />
          </div>
        </Container>
      </Section>
    </>
  )
}
