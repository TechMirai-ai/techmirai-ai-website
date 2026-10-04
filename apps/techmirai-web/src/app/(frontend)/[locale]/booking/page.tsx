import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import siteConfig from '../../../../../site.config'
import { BookingFlow } from '@techmirai/cms-core/booking/ui'
import { Container, Heading, Section } from '@techmirai/cms-core/components/ui'

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

type Props = { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

const titles: Record<Locale, string> = {
  en: 'Book an Appointment',
  ja: '予約する',
}

const descriptions: Record<Locale, string> = {
  en: `Book an appointment online with ${siteConfig.site.name}.`,
  ja: `${siteConfig.site.name}のオンライン予約はこちらから。`,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const base = `https://${siteConfig.site.domain}`
  const defaultLocale = siteConfig.locales.default
  const canonicalPath = locale === defaultLocale ? '/booking' : `/${locale}/booking`

  const languages: Record<string, string> = { 'x-default': `${base}/booking` }
  for (const loc of siteConfig.locales.enabled) {
    languages[loc] = loc === defaultLocale ? `${base}/booking` : `${base}/${loc}/booking`
  }

  return {
    title: titles[locale],
    description: descriptions[locale],
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
      url: `${base}${canonicalPath}`,
      siteName: siteConfig.site.name,
      locale,
      type: 'website',
    },
    alternates: {
      canonical: `${base}${canonicalPath}`,
      languages,
    },
  }
}

export default async function BookingPage({ params }: Props) {
  if (!siteConfig.features.bookingWidget) notFound()

  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <Section>
      <Container>
        {/* Added mt-12 md:mt-16 to push heading down */}
        <Heading level={1} className="mt-12 md:mt-16 mb-8 text-center text-3xl font-semibold">
          {titles[locale]}
        </Heading>
        <BookingFlow locale={locale} clinicName={siteConfig.site.name} className="mx-auto max-w-2xl" />
      </Container>
    </Section>
  )
}