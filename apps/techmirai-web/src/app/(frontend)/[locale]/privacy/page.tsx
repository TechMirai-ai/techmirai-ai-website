import type { Metadata } from 'next'
import { LegalPlaceholder } from '../_components/LegalPlaceholder'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy' }
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  return <LegalPlaceholder locale={locale} titleEn="Privacy Policy" titleJa="プライバシーポリシー" />
}
