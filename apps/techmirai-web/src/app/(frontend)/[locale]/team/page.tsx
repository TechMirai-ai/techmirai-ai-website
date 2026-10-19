import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import siteConfig from '../../../../../site.config'

export const revalidate = 3600

// Not a Spec §4 page (O1): reachable, never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function TeamPage() {
  if (!siteConfig.features.team) notFound()

  return (
    <main>
      <h1>Team</h1>
    </main>
  )
}
