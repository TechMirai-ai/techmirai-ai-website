import type { Metadata } from 'next'
import { ComingSoonStub } from '../../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '導入事例' : 'Case study' }
}

export default async function CaseStudySadiatecPage({ params }: Props) {
  const { locale } = await params
  return <ComingSoonStub locale={locale} titleEn="Case study" titleJa="導入事例" />
}
