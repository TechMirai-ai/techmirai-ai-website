import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import siteConfig from '../../../../../../site.config'
import { Container, Heading, Section } from '@techmirai/cms-core/components/ui'

import { ManagePageClient } from './ManagePageClient'

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

const titles: Record<Locale, string> = {
  en: 'Manage Your Appointment',
  ja: '予約の管理',
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string; token?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return {
    title: titles[locale],
    // A personal, credential-bearing page — never indexed, never linked to.
    robots: { index: false, follow: false },
  }
}

export default async function ManageAppointmentPage({ params, searchParams }: Props) {
  if (!siteConfig.features.bookingWidget) notFound()

  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const { code, token } = await searchParams

  return (
    <Section>
      <Container>
        <Heading level={1} className="mb-8 text-center text-3xl font-semibold">
          {titles[locale]}
        </Heading>
        <ManagePageClient
          locale={locale}
          initialCode={code}
          initialToken={token}
          clinicName={siteConfig.site.name}
          clinicPhone={siteConfig.contact.phone ?? ''}
          cancellationCutoffHours={siteConfig.booking.cancellationCutoffHours}
        />
      </Container>
    </Section>
  )
}
