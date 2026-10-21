import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCachedPayload } from '@/lib/payload'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import siteConfig from '../../../../../../site.config'

export const revalidate = 3600

function isSupportedLocale(s: string): boolean {
  return (siteConfig.locales.enabled as string[]).includes(s)
}

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

type RawBlock = { blockType: string; id?: string } & Record<string, unknown>

// Nothing is prerendered at build time: every page here reads the CMS database,
// and a build host that cannot reach it (ETIMEDOUT) would fail the whole deploy.
// With dynamicParams = true and revalidate, pages render on first request instead.
export function generateStaticParams(): Array<{ locale: string; slug: string }> {
  return []
}

export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isSupportedLocale(locale)) return {}

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })
  const page = result.docs[0]
  if (!page) return {}

  const meta = (page.meta ?? {}) as Record<string, unknown>
  const metaTitle =
    typeof meta['title'] === 'string' && meta['title']
      ? meta['title']
      : typeof page['title'] === 'string'
        ? page['title']
        : ''
  const metaDesc = typeof meta['description'] === 'string' ? meta['description'] : ''
  const metaImage = meta['image'] as Record<string, unknown> | null | undefined
  const metaImageUrl =
    metaImage && typeof metaImage['url'] === 'string' ? metaImage['url'] : undefined

  return {
    title: metaTitle,
    ...(metaDesc ? { description: metaDesc } : {}),
    ...(metaImageUrl ? { openGraph: { images: [metaImageUrl] } } : {}),
  }
}

export default async function AboutSubPage({ params }: Props) {
  const { locale, slug } = await params
  if (!slug) notFound()
  if (!isSupportedLocale(locale)) notFound()

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })

  const page = result.docs[0]
  if (!page) notFound()

  const blocks = (page.layout ?? []) as RawBlock[]

  return (
    <>
      {blocks.map((block, index) => {
        const renderer = blockRegistry[block.blockType]
        if (!renderer) return null
        return <div key={block.id ?? index}>{renderer(block)}</div>
      })}
    </>
  )
}
