import { notFound } from 'next/navigation'
import siteConfig from '../../../../../../site.config'

export const revalidate = 3600

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
