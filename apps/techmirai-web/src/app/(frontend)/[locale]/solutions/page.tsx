import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCachedPayload } from '@/lib/payload'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import siteConfig from '../../../../../site.config'
import { resolveHeaderData } from '../_components/resolveHeaderData'

export const revalidate = 3600

function isSupportedLocale(s: string): boolean {
  return (siteConfig.locales.enabled as string[]).includes(s)
}

type Props = { params: Promise<{ locale: string }> }

type RawBlock = { blockType: string; id?: string } & Record<string, unknown>

// Pack-3/H2: this can no longer simply be deleted the way H1 deleted
// /ai-reception's static stub — solutions/[slug]/page.tsx must exist as a
// sibling for the 4 industry pages, which means the literal "solutions"
// segment is always resolved locally; a missing page.tsx here would 404
// instead of falling through to the top-level [slug] catch-all. So this
// file stays, replaced with a real fetch of the 'solutions' doc (same
// shape as [locale]/[slug]/page.tsx, fixed to one slug) instead of being
// removed. See docs/FINDINGS.md.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) return {}

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'solutions' } },
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

export default async function SolutionsHubPage({ params }: Props) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()

  const payload = await getCachedPayload()

  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'solutions' } },
    locale,
    limit: 1,
  })

  const page = result.docs[0]
  if (!page) notFound()

  let blocks = (page.layout ?? []) as RawBlock[]

  // Mirrors [locale]/[slug]/page.tsx's `cta-banner`/`showContactStrip`
  // injection — see that file's own comment.
  blocks = await Promise.all(
    blocks.map(async (block) => {
      if (block.blockType === 'cta-banner' && block['showContactStrip'] === true) {
        const { lineButton } = await resolveHeaderData(locale)
        return {
          ...block,
          secondaryButton: { ...(block['secondaryButton'] as Record<string, unknown>), href: lineButton.href },
          contactStrip: {
            phone: siteConfig.contact.phone,
            email: siteConfig.contact.email,
            hours: siteConfig.contact.businessHours?.['weekdays'] ?? '',
          },
        } as RawBlock
      }

      return block
    })
  )

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
