import type { Metadata } from 'next'
import { ComingSoonStub } from '../../_components/ComingSoonStub'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ja' ? 'クリニック・治療院' : 'Clinics & treatment rooms' }
}

export default async function SolutionsClinicPage({ params }: Props) {
  const { locale } = await params
  return (
    <ComingSoonStub
      locale={locale}
      titleEn="Clinics & treatment rooms"
      titleJa="クリニック・治療院"
    />
  )
}
