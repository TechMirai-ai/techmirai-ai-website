import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { assertNoLocalizedRowFields } from './lib/locale-safety'

/**
 * Departments are represented by the shared `services` collection rather than a
 * duplicate collection (see packages/cms-core/src/verticals/clinic/collections/).
 *
 * Content source: Sakura_Homepage_Content_List.docx §5 "Department List /
 * Features of Our Clinic" (ja: 「5. 特徴・部門一覧」) — transcribed verbatim.
 * These three entries are what the homepage `department-list` block renders,
 * and they are also the tag vocabulary the doc assigns to Daisuke Tanaka in §6
 * ("Experienced & Professional Care · Support From Treatment to Recovery"),
 * which reaches the doctor card via `doctors.specialties`.
 *
 * Fields the doc gives no content for (icon, body, stats, cta) are left unset —
 * all optional in the schema.
 *
 * All three already exist in the CMS under hand-authored slugs
 * (`Experienced-Professional-Care`, `Treatment-Recovery`,
 * `Easy-Convenient-Visits`), created in the admin with the correct English
 * title and excerpt but with the old placeholder department names still
 * sitting on the `ja` side. So this seeds by UPSERT on those slugs rather than
 * creating new docs — creating fresh `demo-department-*` docs would leave the
 * services collection with two of every feature, and deleting the
 * hand-authored ones is not this script's call to make.
 *
 * As with news.ts, `thumbnail` is only written when a doc has to be created:
 * on an existing doc the image already attached in the admin is left alone.
 * These docs carry no `demo-` prefix, so clearDemoContent() does not remove
 * them; re-running the seed rewrites their fields in place.
 */
const FEATURES = [
  {
    slug: 'Experienced-Professional-Care',
    ja: {
      title: '経験豊富で専門的なケア',
      excerpt:
        '専門知識と患者さま中心の姿勢を組み合わせ、安全で丁寧なケアを提供します。状態をしっかり評価したうえで、最適な施術をご提案します。',
    },
    en: {
      title: 'Experienced & Professional Care',
      excerpt:
        'Our team combines professional knowledge with a patient-focused approach to provide safe, thoughtful care. We carefully assess your condition before recommending the most suitable treatment.',
    },
  },
  {
    slug: 'Treatment-Recovery',
    ja: {
      title: '施術から回復までのサポート',
      excerpt:
        '施術が終わってもサポートは終わりません。回復を支え、快適な動きとより健康的な日常を維持するための理解を深めていただけるようお手伝いします。',
    },
    en: {
      title: 'Support From Treatment to Recovery',
      excerpt:
        "Our care doesn't stop when your treatment ends. We support your recovery and help you understand how to maintain comfortable movement and a healthier everyday lifestyle.",
    },
  },
  {
    slug: 'Easy-Convenient-Visits',
    ja: {
      title: '簡単で便利な来院',
      excerpt:
        '予約のしやすさ、分かりやすい情報、アクセスの良さで、さくら整骨院への来院をシンプルでストレスフリーに。LINEでのご連絡・ご予約も可能です。',
    },
    en: {
      title: 'Easy & Convenient Visits',
      excerpt:
        'We make visiting Sakura simple and stress-free with convenient reservations, clear information, and easy access to our clinic. You can also contact us and make reservations through LINE.',
    },
  },
]

export async function seedDemoServices(payload: Payload): Promise<string[]> {
  const fields = payload.collections['services']?.config.fields
  if (!fields) throw new Error('seedDemoServices: services collection is not registered')
  assertNoLocalizedRowFields(fields, 'services')

  const ids: string[] = []
  for (const [i, feature] of FEATURES.entries()) {
    const perLocale = {
      ja: { title: feature.ja.title, excerpt: feature.ja.excerpt },
      en: { title: feature.en.title, excerpt: feature.en.excerpt },
    }

    // Content this doc replaces, cleared rather than left to rot underneath it:
    //  - `body` still held the previous placeholder prose, written for a
    //    different business name (「さくら接骨院の整形外科的施術では…」).
    //  - `stats` held the previous seed's invented figures, and its rows had
    //    lost their `ja` labels entirely — since `stats[].label` is localized
    //    AND required, that alone made any ja-locale write fail validation.
    // `thumbnail`, `icon` and `cta` are deliberately NOT touched: the first two
    // are visual assets set by hand in the admin, and the CTA copy is generic
    // contact wording the content doc neither supplies nor contradicts.
    const clearedPlaceholders = { body: null, stats: [] }

    const existing = await payload.find({
      collection: 'services',
      where: { slug: { equals: feature.slug } },
      limit: 1,
      depth: 0,
    })

    const found = existing.docs[0]
    if (found) {
      for (const locale of ['ja', 'en'] as const) {
        await payload.update({
          collection: 'services',
          id: found.id,
          locale,
          // `sort` follows the doc's own 1/2/3 ordering, which the admin copy
          // had drifted from.
          data: { ...perLocale[locale], ...clearedPlaceholders, sort: i + 1, active: true },
        })
      }
      // Kept as-is rather than String()-ed: on Postgres these ids are numbers,
      // and stringifying them makes relationship fields that point at them
      // (doctors.specialties, the department-list block) fail validation.
      ids.push(found.id as unknown as string)
      continue
    }

    const doc = await createLocalizedDoc<{ id: string }>(payload, 'services', {
      ja: {
        ...perLocale.ja,
        slug: feature.slug,
        sort: i + 1,
        active: true,
        aiVisible: true,
      },
      en: perLocale.en,
    })
    ids.push(doc.id)
  }
  return ids
}
