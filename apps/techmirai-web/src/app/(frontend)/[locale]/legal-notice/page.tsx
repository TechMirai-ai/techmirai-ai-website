import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/build-metadata'
import { LegalPlaceholder } from '../_components/LegalPlaceholder'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return staticPageMetadata('/legal-notice', locale)
}

export default async function LegalNoticePage({ params }: Props) {
  const { locale } = await params
  return (
    <LegalPlaceholder locale={locale} titleEn="Legal Notice" titleJa="特定商取引法に基づく表記" />
  )
}
