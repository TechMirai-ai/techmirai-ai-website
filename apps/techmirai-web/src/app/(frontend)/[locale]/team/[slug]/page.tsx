import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import siteConfig from '../../../../../../site.config'

export const revalidate = 3600

// Not a Spec §4 page (O1): reachable, never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } }

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function TeamMemberPage({ params }: Props) {
  if (!siteConfig.features.team) notFound()

  const { slug } = await params

  if (!slug) notFound()

  return (
    <main>
      <h1>Team member: {slug}</h1>
    </main>
  )
}
