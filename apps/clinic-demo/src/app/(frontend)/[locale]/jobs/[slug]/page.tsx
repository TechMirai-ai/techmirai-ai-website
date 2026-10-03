import { notFound } from 'next/navigation'
import siteConfig from '../../../../../../site.config'

export const revalidate = 3600

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function JobDetailPage({ params }: Props) {
  if (!siteConfig.features.jobListings) notFound()

  const { slug } = await params

  if (!slug) notFound()

  return (
    <main>
      <h1>Job: {slug}</h1>
    </main>
  )
}
