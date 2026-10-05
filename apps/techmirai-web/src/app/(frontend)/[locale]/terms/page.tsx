import type { Metadata } from 'next'
import { LegalPlaceholder } from '../_components/LegalPlaceholder'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '利用規約' : 'Terms of Use' }
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  return <LegalPlaceholder locale={locale} titleEn="Terms of Use" titleJa="利用規約" />
}
