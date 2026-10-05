import type { Metadata } from 'next'
import { ComingSoonStub } from '../../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '自動車整備・販売' : 'Auto service & dealers' }
}

export default async function SolutionsAutomobilePage({ params }: Props) {
  const { locale } = await params
  return (
    <ComingSoonStub locale={locale} titleEn="Auto service & dealers" titleJa="自動車整備・販売" />
  )
}
