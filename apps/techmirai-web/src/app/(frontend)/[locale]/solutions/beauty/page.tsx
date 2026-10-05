import type { Metadata } from 'next'
import { ComingSoonStub } from '../../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? '美容サロン' : 'Beauty salons' }
}

export default async function SolutionsBeautyPage({ params }: Props) {
  const { locale } = await params
  return <ComingSoonStub locale={locale} titleEn="Beauty salons" titleJa="美容サロン" />
}
