import type { Payload } from 'payload'
import { updateLocalizedDoc, upsertBySlug } from '@techmirai/cms-core/seed'
import { LEGAL_PAGE_META, PAGE_META, pathForPageSlug } from '../../lib/seo/page-meta'
import type { MediaIds } from '../media'

interface PlainPageSeed {
  slug: string
  title: { en: string; ja: string }
}

// Structural page shells for Pack-2/F3's page-group scaffolding: home,
// product, solutions, how-it-works, integrations, pricing, security, about,
// technology, assessment, faq (shell only — real FAQ content lives in the
// `faqs` collection, cleared separately), and the three legal pages
// (privacy/terms/legal-notice — CLAUDE.md rule 7: legal pages get the
// Spec's headings and a placeholder body only; the actual placeholder body
// text is already rendered by the frontend's LegalPlaceholder component and
// registered as docs/PLACEHOLDER-REGISTER.md row E2-01, so this doc exists
// for consistency/future routing, not to duplicate that text here).
//
// `layout` is intentionally empty — Phase G (Pack 3) fills real Spec
// content via /admin. `upsertBySlug`'s idempotent no-op-if-exists path means
// a later `pnpm seed` run never clobbers whatever Phase G has written.
//
// ja titles reuse exactly the strings already committed in
// seed/globals.ts's header/footer nav (Pack-2/E1-E2) where a precedent
// exists; `[JA TODO]` elsewhere, per docs/WORK-ORDER.md §5 — never a new
// translation.
const PLAIN_PAGES: PlainPageSeed[] = [
  { slug: 'home', title: { en: 'Home', ja: '[JA TODO]' } },
  { slug: 'ai-reception', title: { en: 'AI Reception', ja: 'AI受付' } },
  { slug: 'solutions', title: { en: 'Solutions', ja: '業種別' } },
  { slug: 'clinic', title: { en: 'Clinics & treatment rooms', ja: 'クリニック・治療院' } },
  { slug: 'beauty', title: { en: 'Beauty salons', ja: '美容サロン' } },
  { slug: 'automobile', title: { en: 'Auto service & dealers', ja: '自動車整備・販売' } },
  { slug: 'hotel', title: { en: 'Hotels & guesthouses', ja: 'ホテル・宿泊施設' } },
  { slug: 'how-it-works', title: { en: 'How It Works', ja: '仕組み' } },
  { slug: 'integrations', title: { en: 'Integrations', ja: '連携' } },
  { slug: 'pricing', title: { en: 'Pricing', ja: '料金' } },
  { slug: 'security', title: { en: 'Security', ja: '[JA TODO]' } },
  { slug: 'about', title: { en: 'About', ja: '会社紹介' } },
  { slug: 'technology', title: { en: 'Technology', ja: 'AI開発' } },
  { slug: 'faq', title: { en: 'FAQ', ja: 'よくあるご質問' } },
  { slug: 'thanks', title: { en: 'Thank you', ja: '送信完了' } },
  { slug: 'privacy', title: { en: 'Privacy Policy', ja: '[JA TODO]' } },
  { slug: 'terms', title: { en: 'Terms of Use', ja: '[JA TODO]' } },
  { slug: 'legal-notice', title: { en: 'Legal Notice', ja: '[JA TODO]' } },
]

/**
 * Pack-3/H1: this page shell was seeded as `slug: 'product'` before the
 * Spec's actual route (`/ai-reception`) was reconciled — see the H1 plan's
 * "slug/route mismatch" finding. `upsertBySlug` is create-only, so simply
 * renaming the slug above leaves the old `product` doc orphaned in any
 * database that already ran a seed before this fix. Delete it here, once,
 * guarded on an empty `layout` so a human's in-progress work at /product
 * (unlikely, but not impossible) is never silently destroyed.
 */
async function removeOrphanedProductShell(payload: Payload): Promise<void> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'product' } },
    limit: 1,
    depth: 0,
  })
  const doc = existing.docs[0]
  if (!doc) return
  const layout = doc['layout']
  if (Array.isArray(layout) && layout.length === 0) {
    await payload.delete({ collection: 'pages', id: doc['id'] as string | number })
    payload.logger.info('🧹 Removed orphaned pre-rename "product" page shell (now ai-reception)')
  }
}

/**
 * Pack-4/J1: `/assessment` moved from a catch-all `pages` shell to its own
 * dedicated route (`[locale]/assessment/page.tsx`), matching `/contact`'s
 * existing precedent (which never had a `pages` shell at all). Same
 * guarded-delete pattern as `removeOrphanedProductShell` above — only
 * removes the old shell doc if its `layout` is still empty, so any
 * in-progress admin work is never silently destroyed.
 */
async function removeOrphanedAssessmentShell(payload: Payload): Promise<void> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'assessment' } },
    limit: 1,
    depth: 0,
  })
  const doc = existing.docs[0]
  if (!doc) return
  const layout = doc['layout']
  if (Array.isArray(layout) && layout.length === 0) {
    await payload.delete({ collection: 'pages', id: doc['id'] as string | number })
    payload.logger.info('🧹 Removed orphaned "assessment" page shell (now a dedicated route)')
  }
}

/**
 * Pack-4/L1: Spec §17.1 titles/descriptions (lib/seo/page-meta.ts) for every
 * shell that has a row. upsertBySlug never touches an existing doc, so this
 * also updates docs created by earlier seeds — but only while their meta is
 * still a seeded placeholder, so a title edited in /admin is never clobbered.
 * One single-locale write per locale, NOT one locale:'all' write: verified
 * against this DB that a locale:'all' update silently drops localized leaves
 * inside a group (and clears the upload) — docs/FINDINGS.md 2026-10-14 L1.
 * `meta` holds no array/blocks fields, so the per-locale clobbering that
 * updateLocalizedDoc exists to avoid cannot happen here. The doc's existing
 * share image is re-sent so it is kept. Exported so it can run on its own
 * against an already-seeded database without the full (clearing) seed.
 */
export async function seedSpecMeta(payload: Payload, slug: string): Promise<void> {
  const row = PAGE_META[pathForPageSlug(slug)] ?? LEGAL_PAGE_META[pathForPageSlug(slug)]
  if (!row) return

  const current = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, locale: 'en', limit: 1, depth: 0 })
  const currentMeta = current.docs[0]?.['meta'] as { title?: unknown; image?: unknown } | undefined
  const currentTitle = currentMeta?.title
  const image = currentMeta?.image ?? null
  const isPlaceholder = typeof currentTitle !== 'string' || currentTitle === '' || currentTitle.startsWith('[TBD')
  if (!isPlaceholder) return

  for (const locale of ['en', 'ja'] as const) {
    await updateLocalizedDoc(payload, 'pages', slug, { [locale]: { meta: { ...row[locale], image } } })
  }
}

export async function seedPlainPages(payload: Payload, media: MediaIds): Promise<void> {
  await removeOrphanedProductShell(payload)
  await removeOrphanedAssessmentShell(payload)
  for (const page of PLAIN_PAGES) {
    await upsertBySlug(payload, 'pages', page.slug, {
      title: page.title,
      layout: [],
      meta: {
        title: { en: `[TBD: Spec ${page.title.en} page title not yet seeded]`, ja: '[JA TODO]' },
        description: { en: `[TBD: Spec ${page.title.en} page description not yet seeded]`, ja: '[JA TODO]' },
        image: media.ogImages[page.slug],
      },
    })
    await seedSpecMeta(payload, page.slug)
  }
  payload.logger.info(`📄 ${PLAIN_PAGES.length} page shells ready (${PLAIN_PAGES.map((p) => p.slug).join(', ')})`)
}
