import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCachedPayload } from '@/lib/payload'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import { SOLUTIONS_PAGE_SLUGS } from '@/lib/solutions-slugs'
import siteConfig from '../../../../../../site.config'
import { metadataFromPageDoc } from '@/lib/seo/build-metadata'
import { resolveHeaderData } from '../../_components/resolveHeaderData'

export const revalidate = 3600

function isSupportedLocale(s: string): boolean {
  return (siteConfig.locales.enabled as string[]).includes(s)
}

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

type RawBlock = { blockType: string; id?: string } & Record<string, unknown>

export async function generateStaticParams() {
  const locales = siteConfig.locales.enabled as string[]

  return locales.flatMap((locale) => SOLUTIONS_PAGE_SLUGS.map((slug) => ({ locale, slug })))
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

  return metadataFromPageDoc(page as Record<string, unknown>, locale, `/solutions/${slug}`)
}

export default async function SolutionsIndustryPage({ params }: Props) {
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

  let blocks = (page.layout ?? []) as RawBlock[]

  // Mirrors [locale]/[slug]/page.tsx's `cta-banner`/`showContactStrip`
  // injection (the only siteConfig-sourced branch this page's template
  // actually uses) — see that file's own comment for why this is
  // duplicated rather than shared.
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
