import type { Metadata } from 'next'
import { ComingSoonStub } from '../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '連携' : 'Integrations' }
}

export default async function IntegrationsPage({ params }: Props) {
  const { locale } = await params
  return <ComingSoonStub locale={locale} titleEn="Integrations" titleJa="連携" />
}
