import type { Metadata } from 'next'
import { ComingSoonStub } from '../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? 'よくあるご質問' : 'FAQ' }
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params
  return <ComingSoonStub locale={locale} titleEn="FAQ" titleJa="よくあるご質問" />
}
