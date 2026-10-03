import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { assertNoLocalizedRowFields } from './lib/locale-safety'

/**
 * Content source: Sakura_Homepage_Content_List.docx §2 "News List
 * (Announcements)" (ja: 「2. お知らせ一覧」) — three items, transcribed
 * verbatim with their dates and their `notice` type.
 *
 * These three already exist in the CMS under hand-authored slugs
 * (`holiday`, `reservation`, `line`), created in the admin with the correct
 * dates and correct English titles but with the old placeholder text still
 * sitting on the `ja` side. So this seeds by UPSERT on those slugs rather than
 * creating new docs — creating fresh `demo-news-*` docs would leave the site
 * with two of every announcement, and deleting the hand-authored ones is not
 * this script's call to make.
 *
 * Consequences of upserting rather than creating:
 *   - `thumbnail` (schema-required) and `publishedAt` are only written when the
 *     doc has to be created; on an existing doc the image already attached in
 *     the admin is left untouched.
 *   - These docs carry no `demo-` prefix, so clearDemoContent() does not remove
 *     them. That is intentional — they are client-authored records. Re-running
 *     the seed simply rewrites their fields in place.
 *
 * The doc supplies a title, date and type per item and nothing else, so
 * `excerpt` and `content` are explicitly cleared in both locales: whatever is
 * in them now is leftover demo placeholder prose, not client content.
 */
const NEWS_ITEMS = [
  {
    slug: 'holiday',
    publishedAt: '2026-08-17',
    ja: { title: '夏季休業のお知らせ' },
    en: { title: 'Notice Regarding Summer Holiday Closure' },
  },
  {
    slug: 'reservation',
    publishedAt: '2026-08-05',
    ja: { title: '初めての方へ：ご予約・施術の流れガイド' },
    en: { title: 'For First-Time Visitors: Reservation & Treatment Guide' },
  },
  {
    slug: 'line',
    publishedAt: '2026-07-25',
    ja: { title: 'LINEでの簡単予約・お問い合わせが可能になりました' },
    en: { title: 'Easy Reservations & Inquiries Now Available via LINE' },
  },
]

// Doc §2: "Type: notice" for all three (ja: 「種別：notice（お知らせ）」).
const CATEGORY_JA = 'お知らせ'
const CATEGORY_EN = 'notice'

export async function seedDemoNews(payload: Payload, thumbnailIds: string[]): Promise<string[]> {
  const fields = payload.collections['news']?.config.fields
  if (!fields) throw new Error('seedDemoNews: news collection is not registered')
  assertNoLocalizedRowFields(fields, 'news')

  const ids: string[] = []
  for (const [i, item] of NEWS_ITEMS.entries()) {
    const existing = await payload.find({
      collection: 'news',
      where: { slug: { equals: item.slug } },
      limit: 1,
      depth: 0,
    })

    const perLocale = {
      ja: { title: item.ja.title, category: CATEGORY_JA, excerpt: null, content: null },
      en: { title: item.en.title, category: CATEGORY_EN, excerpt: null, content: null },
    }

    const found = existing.docs[0]
    if (found) {
      for (const locale of ['ja', 'en'] as const) {
        await payload.update({
          collection: 'news',
          id: found.id,
          locale,
          data: { ...perLocale[locale], publishedAt: item.publishedAt },
        })
      }
      // Kept as-is rather than String()-ed: on Postgres these ids are numbers,
      // and stringifying them makes relationship fields that point at them
      // (doctors.specialties, the department-list block) fail validation.
      ids.push(found.id as unknown as string)
      continue
    }

    const doc = await createLocalizedDoc<{ id: string }>(payload, 'news', {
      ja: {
        ...perLocale.ja,
        // Required by the schema; the doc supplies no imagery. Placeholder,
        // written only when the doc does not already exist.
        thumbnail: thumbnailIds[i]!,
        publishedAt: item.publishedAt,
        slug: item.slug,
        aiVisible: true,
      },
      en: perLocale.en,
    })
    ids.push(doc.id)
  }
  return ids
}
