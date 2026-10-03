import { notFound } from 'next/navigation'
import siteConfig from '../../../../../../site.config'
import { Container, Heading, Section } from '@techmirai/cms-core/components/ui'
import { LiffBookingClient } from './LiffBookingClient'

type Props = { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

// Mirrors (frontend)/[locale]/booking/page.tsx's titles record — the LIFF
// route doesn't reuse that page component (STEP 2 Part 2 item 1's "thin
// page shell" deliberately has no Header/Footer/marketing chrome), so the
// locale-keyed title string is duplicated here rather than shared.
const titles: Record<string, string> = {
  en: 'Book an Appointment',
  ja: '予約する',
}

/**
 * STEP 2 Part 2 item 1 — the LIFF booking URL, registered as this LIFF
 * app's endpoint in the LINE Developers Console (LIFF tab). All actual
 * LIFF/booking logic lives in LiffBookingClient ('use client' — liff.init()
 * only runs in the browser); this file is just locale validation +
 * metadata, matching (frontend)/[locale]/booking/page.tsx's pattern.
 */
export default async function LiffBookingPage({ params }: Props) {
  if (!siteConfig.features.bookingWidget) notFound()

  const { locale } = await params
  if (!siteConfig.locales.enabled.includes(locale)) notFound()

  return (
    <Section className="py-4!">
      <Container>
        <Heading level={1} className="mb-4 text-center text-2xl! font-semibold">
          {titles[locale] ?? titles['en']}
        </Heading>
        <LiffBookingClient locale={locale} clinicName={siteConfig.site.name} />
      </Container>
    </Section>
  )
}
