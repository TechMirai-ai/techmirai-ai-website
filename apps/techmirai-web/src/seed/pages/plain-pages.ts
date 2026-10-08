import type { Payload } from 'payload'
import { upsertBySlug } from '@techmirai/cms-core/seed'
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
  { slug: 'how-it-works', title: { en: 'How It Works', ja: '仕組み' } },
  { slug: 'integrations', title: { en: 'Integrations', ja: '連携' } },
  { slug: 'pricing', title: { en: 'Pricing', ja: '料金' } },
  { slug: 'security', title: { en: 'Security', ja: '[JA TODO]' } },
  { slug: 'about', title: { en: 'About', ja: '会社紹介' } },
  { slug: 'technology', title: { en: 'Technology', ja: 'AI開発' } },
  { slug: 'assessment', title: { en: 'Free AI Website Assessment', ja: '無料AIホームページ診断' } },
  { slug: 'faq', title: { en: 'FAQ', ja: 'よくあるご質問' } },
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

export async function seedPlainPages(payload: Payload, media: MediaIds): Promise<void> {
  await removeOrphanedProductShell(payload)
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
  }
  payload.logger.info(`📄 ${PLAIN_PAGES.length} page shells ready (${PLAIN_PAGES.map((p) => p.slug).join(', ')})`)
}
