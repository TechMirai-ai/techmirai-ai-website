import type { Metadata } from 'next'
import { ComingSoonStub } from '../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params
  return { title: 'AI受付' }
}

export default async function AiReceptionPage({ params }: Props) {
  const { locale } = await params
  return <ComingSoonStub locale={locale} titleEn="AI受付" titleJa="AI受付" />
}
