import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { createPlaceholderPdf } from './lib/placeholder-pdf'
import { upsertMedia } from './media'

export interface DownloadIds {
  brochureUrl: string
}

/**
 * Pack-3/G4, Spec §5.14 "Download the brochure (PDF)". The real brochure
 * (TECHMIRAI_BROCHURE.html-derived PDF) hasn't been supplied yet (register
 * row D2-01) — this seeds a clearly-labelled placeholder PDF so the link
 * works today, closing the gap docs/FINDINGS.md's 2026-10-06 F3 note #1
 * flagged ("revisit once a real download has an actual home on a page").
 * See docs/PLACEHOLDER-REGISTER.md row G4-02. Idempotent on re-run:
 * `downloads.slug` is unique, looked up before creating.
 */
export async function seedDownloads(payload: Payload): Promise<DownloadIds> {
  const existing = await payload.find({
    collection: 'downloads',
    where: { slug: { equals: 'techmirai-brochure' } },
    limit: 1,
    depth: 1,
  })
  if (existing.docs[0]) {
    const fileDoc = existing.docs[0]['file'] as { url?: string } | undefined
    payload.logger.info('📄 Placeholder brochure PDF already seeded')
    return { brochureUrl: fileDoc?.url ?? '' }
  }

  const buffer = createPlaceholderPdf(
    'TechMirai — Company & Service Brochure (PLACEHOLDER)',
    'Real brochure not yet supplied — see docs/PLACEHOLDER-REGISTER.md D2-01.',
  )
  const fileId = await upsertMedia(
    payload,
    'techmirai-brochure-placeholder.pdf',
    buffer,
    { en: 'TechMirai brochure (placeholder PDF)', ja: 'TechMiraiパンフレット（プレースホルダーPDF）' },
    'application/pdf',
  )

  await createLocalizedDoc(payload, 'downloads', {
    en: {
      title: 'TechMirai Brochure',
      description: 'PLACEHOLDER — real brochure not yet supplied.',
      file: fileId,
      category: 'Company',
      meta: 'PDF (placeholder)',
      slug: 'techmirai-brochure',
      active: true,
    },
    ja: {
      title: 'TechMirai 資料',
      description: '実際の資料は未提供のプレースホルダーです。',
      file: fileId,
      category: '会社資料',
      meta: 'PDF（プレースホルダー）',
      slug: 'techmirai-brochure',
      active: true,
    },
  })

  const fileDoc = await payload.findByID({ collection: 'media', id: fileId, depth: 0 })
  payload.logger.info('📄 Placeholder brochure PDF seeded (Spec §5.14 "Download the brochure" link)')
  return { brochureUrl: (fileDoc as { url?: string })?.url ?? '' }
}
