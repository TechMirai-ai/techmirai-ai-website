import type { Metadata } from 'next'
import { ComingSoonStub } from '../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '料金' : 'Pricing' }
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  return <ComingSoonStub locale={locale} titleEn="Pricing" titleJa="料金" />
}
