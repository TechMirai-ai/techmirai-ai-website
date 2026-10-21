import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCachedPayload } from '@/lib/payload'
import { staticParamsOrEmpty } from '@/lib/static-params'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import siteConfig from '../../../../../site.config'
import { resolveHeaderData } from '../_components/resolveHeaderData'
import { metadataFromPageDoc } from '@/lib/seo/build-metadata'
import { pathForPageSlug } from '@/lib/seo/page-meta'
import { serviceJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/lib/seo/JsonLd'
import { launchBreadcrumbJsonLd } from '@/lib/seo/voice-json-ld'

const SERVICE_PAGE_SLUGS: readonly string[] = ['ai-reception', 'pricing']

// Slugs that have their own route folder. A `pages` document may still exist
// for them (seed scaffolding), but this catch-all must not prerender them:
// the duplicate path made the production build serve the document's empty
// layout instead of the dedicated page (docs/ENGINE-FIXES.md, Pack-4/O2).
const DEDICATED_ROUTE_SLUGS: ReadonlySet<string> = new Set(['assessment'])

export const revalidate = 3600

function isSupportedLocale(s: string): boolean {
  return (siteConfig.locales.enabled as string[]).includes(s)
}

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

type RawBlock = { blockType: string; id?: string } & Record<string, unknown>

export async function generateStaticParams() {
  return staticParamsOrEmpty('[slug]', async () => {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'pages',
      limit: 1000,
      select: { slug: true },
    })

    const locales = siteConfig.locales.enabled as string[]

    return locales.flatMap((locale) =>
      result.docs
        .filter((doc) => typeof doc.slug === 'string' && !DEDICATED_ROUTE_SLUGS.has(doc.slug))
        .map((doc) => ({ locale, slug: doc.slug as string }))
    )
  })
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

  // Pack-3/I4's generic `meta.noindex` switch (e.g. /thanks) is honoured
  // inside the helper; Pack-4/L1 adds canonical + hreflang.
  return metadataFromPageDoc(page as Record<string, unknown>, locale, pathForPageSlug(slug))
}

export default async function DynamicPage({ params }: Props) {
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

  // Pack-3/I2: fetched once and reused by three branches below (team-grid
  // injection, ceo-message removal, label-value-list row-gating) — the
  // homepage's own page.tsx only ever needed this for team-grid, but this
  // catch-all serves every other page, including /about which needs all
  // three. See docs/ENGINE-FIXES.md's Pack-3/I2 entry.
  const companyInfo = await payload.findGlobal({ slug: 'company-info', depth: 0 }).catch(() => null)
  const founder = (companyInfo as Record<string, unknown> | null)?.['founder'] as
    | { visible?: boolean; person?: unknown }
    | undefined
  const founderVisible = founder?.visible !== false
  const founderPersonId = founder?.person

  // === RESOLVE NEWS LIST BLOCK FALLBACK (same as homepage) ===
  const resolvedBlocks = await Promise.all(
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
      // pure functions of the raw Payload block data), so the page renderer merges
      // in the relevant SiteConfig values before dispatch — same pattern as the
      // news-list fallback above.
      if (block.blockType === 'booking-cta') {
        return {
          ...block,
          enabled: siteConfig.features.bookingWidget,
          bookingProviderUrl: siteConfig.integrations.bookingProviderUrl,
        } as RawBlock
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

      if (block.blockType === 'cta-banner' && block['showContactStrip'] === true) {
        // Mirrors [locale]/page.tsx (home)'s identical branch — the final
        // call-to-action from Spec §5.14 is reused verbatim on other pages
        // (Pack-3/H1 and onward), so it needs the same LINE-URL/contact-strip
        // injection here too.
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

      // Pack-3/I4: /thanks's page-hero carries the Spec §12.3 "message us on
      // LINE" link as its own secondaryButton, with the same '#' sentinel
      // convention cta-banner already uses above — no other page-hero
      // secondaryButton in the repo uses '#' (they link to real hrefs like
      // /assessment or a live-demo URL), so this only ever fires where a
      // seed file deliberately opts in.
      if (block.blockType === 'page-hero') {
        const secondaryButton = block['secondaryButton'] as Record<string, unknown> | undefined
        if (secondaryButton?.['href'] === '#') {
          const { lineButton } = await resolveHeaderData(locale)
          return {
            ...block,
            secondaryButton: { ...secondaryButton, href: lineButton.href },
          } as RawBlock
        }
      }

      // === FOUNDER-VISIBILITY GATING (Pack-3/I2, Spec §2.3) ===
      // Mirrors [locale]/page.tsx (home)'s team-grid branch, plus two new
      // cases the homepage never needed: ceo-message (the whole block is
      // the founder message) and label-value-list (a single row, e.g. the
      // company-profile "Representative" row, can be founder-gated).
      if (block.blockType === 'team-grid') {
        return {
          ...block,
          founderVisible,
          founderPersonId,
        } as RawBlock
      }

      if (block.blockType === 'ceo-message') {
        return founderVisible ? block : null
      }

      if (block.blockType === 'label-value-list' && !founderVisible) {
        const rows = Array.isArray(block['rows']) ? (block['rows'] as Record<string, unknown>[]) : []
        return {
          ...block,
          rows: rows.filter((row) => row['founderGated'] !== true),
        } as RawBlock
      }

      if (block.blockType === 'rich-text' && block['founderGated'] === true && !founderVisible) {
        return null
      }

      return block
    })
  )

  blocks = resolvedBlocks.filter((b): b is RawBlock => b !== null)

  // Voice-pivot: BreadcrumbList for the launch pages (demo, partners, company).
  const breadcrumb = launchBreadcrumbJsonLd(locale as 'en' | 'ja', pathForPageSlug(slug))

  return (
    <>
      {/* Pack-4/L2: Spec §17.3 Service markup on the product and pricing pages only. */}
      {SERVICE_PAGE_SLUGS.includes(slug) && <JsonLd data={serviceJsonLd()} />}
      {breadcrumb && <JsonLd data={breadcrumb} />}
      {blocks.map((block, index) => {
        const renderer = blockRegistry[block.blockType]
        if (!renderer) return null
        return <div key={block.id ?? index}>{renderer(block)}</div>
      })}
    </>
  )
}