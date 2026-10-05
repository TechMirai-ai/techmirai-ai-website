import type { Metadata } from 'next'
import { ComingSoonStub } from '../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '無料AIホームページ診断' : 'Free AI Website Assessment' }
}

export default async function AssessmentPage({ params }: Props) {
  const { locale } = await params
  return (
    <ComingSoonStub
      locale={locale}
      titleEn="Free AI Website Assessment"
      titleJa="無料AIホームページ診断"
    />
  )
}
