import type { Payload } from 'payload'
import { updateLocalizedDoc, upsertBySlug } from '@techmirai/cms-core/seed'
import { JA_TODO, seedVoiceHome } from './voice-home'
import { VOICE_PAGES } from './voice-pages'
import { VOICE_META } from '../../lib/seo/voice-meta'

/**
 * Voice-pivot orchestrator: writes the launch pages (/, /demo, /partners,
 * /company) and their SEO meta. Idempotent — safe to re-run, and it never
 * clears anything (unlike the full `pnpm seed`). Run on its own with
 * `pnpm seed:voice`.
 */
type AnyRec = Record<string, unknown>

async function seedMeta(payload: Payload, slug: string, path: string): Promise<void> {
  const meta = VOICE_META[path]
  if (!meta) return
  const current = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, locale: 'en', limit: 1, depth: 0 })
  const image = (current.docs[0]?.['meta'] as { image?: unknown } | undefined)?.image ?? null
  for (const locale of ['en', 'ja'] as const) {
    await updateLocalizedDoc(payload, 'pages', slug, { [locale]: { meta: { ...meta[locale], image } } })
  }
}

// A combined locale:'all' write was observed to keep the old Japanese title
// (the English one updated), so titles are written one locale at a time. A
// top-level text field has no array/blocks clobbering risk (see utils.ts).
async function setTitles(payload: Payload, slug: string, title: { en: string; ja: string }): Promise<void> {
  const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const id = found.docs[0]?.['id'] as number | string | undefined
  if (id === undefined) return
  for (const locale of ['en', 'ja'] as const) {
    await payload.update({ collection: 'pages', id, locale, data: { title: title[locale] } })
  }
}

export async function seedVoicePivot(payload: Payload): Promise<void> {
  for (const page of VOICE_PAGES) {
    await upsertBySlug(payload, 'pages', page.slug, {
      title: page.title,
      layout: [],
      meta: { title: { en: `[TBD: ${page.slug} title]`, ja: JA_TODO }, description: { en: `[TBD: ${page.slug} description]`, ja: JA_TODO } },
    })
    await updateLocalizedDoc(payload, 'pages', page.slug, {
      en: { title: page.title.en, layout: page.en } as AnyRec,
      ja: { title: page.title.ja, layout: page.ja } as AnyRec,
    })
    await setTitles(payload, page.slug, page.title)
    await seedMeta(payload, page.slug, `/${page.slug}`)
  }

  await seedVoiceHome(payload)
  await setTitles(payload, 'home', { en: 'Home', ja: 'ホーム' })
  await seedMeta(payload, 'home', '')
  payload.logger.info('🎙️ Voice-pivot pages seeded: home, demo, partners, company')
}
