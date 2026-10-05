import type { Metadata } from 'next'
import { LegalPlaceholder } from '../_components/LegalPlaceholder'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '特定商取引法に基づく表記' : 'Legal Notice' }
}

export default async function LegalNoticePage({ params }: Props) {
  const { locale } = await params
  return (
    <LegalPlaceholder locale={locale} titleEn="Legal Notice" titleJa="特定商取引法に基づく表記" />
  )
}
