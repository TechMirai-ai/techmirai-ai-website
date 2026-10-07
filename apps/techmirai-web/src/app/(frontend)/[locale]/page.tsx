import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCachedPayload } from '@/lib/payload'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import siteConfig from '../../../../site.config'
import { resolveHeaderData } from './_components/resolveHeaderData'
import { generateQrCodeDataUrl } from '@/lib/qr-code'
export const revalidate = 3600

const SUPPORTED_LOCALES = ['en', 'ja'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function isSupportedLocale(s: string): s is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(s)
}

type RawBlock = {
  blockType: string
  id?: string
  source?: string
  selectedItems?: unknown[]
  count?: number
  resolvedItems?: unknown[]   // add this
} & Record<string, unknown>

// Mirrors [slug]/page.tsx's generateMetadata — the root route reads the same
// `pages` collection (slug 'home') but isn't covered by that catch-all route,
// so it needs its own metadata resolution or the document <title> is empty.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) return {}

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale,
    limit: 1,
  })
  const page = result.docs[0]
  if (!page) return { title: siteConfig.site.name }

  const meta = (page.meta ?? {}) as Record<string, unknown>
  const metaTitle = typeof meta['title'] === 'string' && meta['title']
    ? meta['title']
    : typeof page['title'] === 'string' && page['title']
      ? page['title']
      : siteConfig.site.name
  const metaDesc = typeof meta['description'] === 'string' ? meta['description'] : undefined

  return {
    title: metaTitle,
    ...(metaDesc ? { description: metaDesc } : {}),
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isSupportedLocale(locale)) notFound()

  const payload = await getCachedPayload()

  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale,
    limit: 1,
  })

  const page = result.docs[0]
  if (!page) return null

  let blocks = (page.layout ?? []) as RawBlock[]

  // === RESOLVE NEWS LIST BLOCK FALLBACK ===
blocks = await Promise.all(
  blocks.map(async (block) => {
    if (block.blockType === 'news-list') {
      const source = block.source as string | undefined
      const selectedItems = block.selectedItems as any[] | undefined

      if (source === 'collection' && (!selectedItems || selectedItems.length === 0)) {
        const count = typeof block.count === 'number' ? block.count : 5

        const latest = await payload.find({
          collection: 'news',
          where: {
            // Check if the 'title' field has a value for the current locale
            // Replace 'title' with any mandatory field in your collection
            'title': {
              exists: true,
              not_equals: null, // Ensure it's not empty
            },
          },
          sort: '-publishedAt',
          limit: count,
          depth: 1,
          locale: locale,          // Tell Payload to return localized data
          fallbackLocale: false,   // CRITICAL: Prevent fallback to default language
        })

        return {
          ...block,
          resolvedItems: latest.docs
        } as RawBlock
      }
    }

    // === INJECT SITECONFIG-SOURCED FIELDS ===
    // These blocks have no direct siteConfig access (blockRegistry renderers are
    // pure functions of the raw Payload block data) — same pattern as [slug]/page.tsx.
    if (block.blockType === 'booking-cta') {
      return {
        ...block,
        enabled: siteConfig.features.bookingWidget,
        bookingProviderUrl: siteConfig.integrations.bookingProviderUrl,
      } as RawBlock
    }

    if (block.blockType === 'live-demo' && siteConfig.integrations.demoUrl) {
      // Generated fresh on each render from the config URL, not baked in
      // at seed time — see the G2 plan's QR-code decision.
      const qrCodeDataUrl = await generateQrCodeDataUrl(siteConfig.integrations.demoUrl)
      return { ...block, qrCodeDataUrl } as RawBlock
    }

    if (block.blockType === 'hours-location') {
      const address = siteConfig.contact.address as Record<string, string> | undefined
      return {
        ...block,
        address: address?.[locale] ?? address?.[siteConfig.locales.default],
        phone: siteConfig.contact.phone,
        mapEmbedUrl: siteConfig.contact.mapEmbedUrl,
        businessHours: siteConfig.contact.businessHours,
      } as RawBlock
    }
    if (block.blockType === 'hero') {
  const { navItems, cmsLogoUrl, phoneButton, lineButton } = await resolveHeaderData(locale)
  // Spec §5.1: the hero's 2x2 nav cards show exactly these 4 items, not every
  // top-level header link — curated here so growing the header's nav list
  // doesn't silently inflate the hero.
  const heroCardHrefs = ['/ai-reception', '/solutions', '/how-it-works', '/pricing']
  // The "Our staff: [hours]" row is never seeded as CMS text — it's injected
  // here from siteConfig.contact.businessHours (F1-21's single source of
  // truth), same pattern as phoneButton/lineButton above, so the bracketed
  // hours value is never duplicated into seed content.
  const hoursCardRaw = block['hoursCard'] as Record<string, unknown> | undefined
  const staffHoursValue = siteConfig.contact.businessHours?.['weekdays']
  const hoursCard =
    hoursCardRaw && staffHoursValue ? { ...hoursCardRaw, staffHoursValue } : hoursCardRaw
  return {
    ...block,
    navItems: navItems
      .filter((item) => heroCardHrefs.includes(item.href))
      .map((item) => ({ label: item.label, href: item.href })),
    logoUrl: cmsLogoUrl ?? `/${siteConfig.brand.logoFile}`,
    phoneButton,
    lineButton,
    ...(hoursCard ? { hoursCard } : {}),
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