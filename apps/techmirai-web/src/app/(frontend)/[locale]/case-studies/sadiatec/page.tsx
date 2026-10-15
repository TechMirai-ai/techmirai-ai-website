import type { Metadata } from 'next'
import { buildPageMetadata, staticPageMetadata } from '@/lib/seo/build-metadata'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/lib/seo/JsonLd'
import { getCachedPayload } from '@/lib/payload'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import { ComingSoonStub } from '../../_components/ComingSoonStub'

export const revalidate = 3600

const CASE_STUDY_PATH = '/case-studies/sadiatec'

type Props = { params: Promise<{ locale: string }> }

type RawBlock = { blockType: string; id?: string } & Record<string, unknown>

// Pack-3/I3: this collection's own `visible` field (defaultValue false) is
// the Sadiatec-permission gate (docs/PLACEHOLDER-REGISTER.md F1-14) — while
// it's false (or the doc doesn't exist yet), this route must keep behaving
// exactly as it did before this step: the same ComingSoonStub, with no
// Sadiatec-identifying content reachable. Only when a developer flips
// `visible` to true, after Sadiatec's written OK, does the real layout
// render — via the same `blockRegistry` the generic `[locale]/[slug]/page.tsx`
// catch-all already uses for `pages.layout`.
//
// Two-step fetch, not one: verified while building this step that Next.js's
// RSC flight protocol can embed a `payload.find()` call's full result as an
// unreferenced flight chunk in the page's raw HTML response even when that
// result is never rendered into JSX (confirmed harmless on `/about` only
// because its own already-public doc happens to equal what's rendered —
// see docs/FINDINGS.md). Since this collection's full doc is NOT meant to
// be public yet, this route never lets the full-content `payload.find()`
// run at all while `visible` is false — only a `select`-limited
// `{ visible }` lookup touches the database until permission is confirmed.
async function findVisibleCaseStudy(locale: string) {
  const payload = await getCachedPayload()
  const visibilityCheck = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: 'sadiatec' } },
    locale,
    limit: 1,
    depth: 0,
    select: { visible: true },
  })
  if (visibilityCheck.docs[0]?.['visible'] !== true) return null

  const result = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: 'sadiatec' } },
    locale,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const doc = await findVisibleCaseStudy(locale)
  // Pack-4/L1: the Spec §17.1 title names Sadiatec, so it is used only once the
  // permission switch is on; until then the stub keeps its generic title.
  if (!doc) {
    return buildPageMetadata({ locale, path: CASE_STUDY_PATH, title: locale === 'ja' ? '導入事例' : 'Case study' })
  }
  return staticPageMetadata(CASE_STUDY_PATH, locale)
}

export default async function CaseStudySadiatecPage({ params }: Props) {
  const { locale } = await params
  const doc = await findVisibleCaseStudy(locale)

  if (!doc) {
    return <ComingSoonStub locale={locale} titleEn="Case study" titleJa="導入事例" />
  }

  const blocks = (doc['layout'] ?? []) as RawBlock[]

  return (
    <>
      {/* Pack-4/L2: BreadcrumbList — reached only past the visibility gate above. */}
      <JsonLd data={breadcrumbJsonLd(locale === 'en' ? 'en' : 'ja', [{ path: '' }, { path: CASE_STUDY_PATH }])} />
      {blocks.map((block, index) => {
        const renderer = blockRegistry[block.blockType]
        if (!renderer) return null
        return <div key={block.id ?? index}>{renderer(block)}</div>
      })}
    </>
  )
}
