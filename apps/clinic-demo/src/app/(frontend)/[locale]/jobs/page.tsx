import { notFound } from 'next/navigation'
import siteConfig from '../../../../../site.config'

export const revalidate = 3600

export default function JobsPage() {
  if (!siteConfig.features.jobListings) notFound()

  return (
    <main>
      <h1>Jobs</h1>
    </main>
  )
}
