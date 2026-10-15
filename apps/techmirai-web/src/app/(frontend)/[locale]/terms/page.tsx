import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/build-metadata'
import { LegalPage } from '../_components/LegalPage'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return staticPageMetadata('/terms', locale)
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  return <LegalPage locale={locale} page="terms" />
}
