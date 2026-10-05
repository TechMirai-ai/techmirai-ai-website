import type { Metadata } from 'next'
import { ComingSoonStub } from '../../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? 'ホテル・宿泊施設' : 'Hotels & guesthouses' }
}

export default async function SolutionsHotelPage({ params }: Props) {
  const { locale } = await params
  return <ComingSoonStub locale={locale} titleEn="Hotels & guesthouses" titleJa="ホテル・宿泊施設" />
}
