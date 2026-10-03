import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Homepage — slug `home`, rendered at the site root `/`.
 *
 * ALL content below is transcribed verbatim from Sakura_Homepage_Content_List.docx,
 * which is the client's real homepage copy. It replaces (does not patch) the
 * previous placeholder seed, which had been written against an older block
 * schema — most of its fields (hero `eyebrow`/`inlineStats`/`sideCards`/
 * `promoCards`, `treatment-list.treatments` as relationship ids, page
 * `status`) no longer exist in the block configs, so Payload silently dropped
 * them and the hero fell through to its hardcoded component defaults.
 *
 * The layout mirrors the doc's own block order:
 *   1. hero            (doc §1, incl. the §1 "Notes")
 *   2. news-list       (doc §2)
 *   3. mission-statement (doc §3)
 *   4. services-grid   (doc §4 "Treatment Details" + "Treatment Categories")
 *   5. department-list (doc §5 "Features of Our Clinic")
 *   6. doctor-grid     (doc §6)
 *   7. hours-location  (doc §7)
 *
 * ADDRESS: per Jamal's decision, the Tokyo/Setagaya address and the
 * +81-3-5432-1188 phone are used everywhere, including in the Hero block —
 * the Gifu address the doc's Hero section literally shows is never seeded.
 * The phone itself is not a hero field; it comes from the Header global
 * (see ../globals-header.ts). The hours-location block carries no address or
 * phone fields of its own either — the root route injects those from
 * site.config.ts, which already holds the correct Tokyo values.
 */

const ADDRESS_JA = '〒154-0022 東京都世田谷区梅丘2-14-8 さくらビル1F'
const ADDRESS_EN = 'Sakura Building 1F, 2-14-8 Umegaoka, Setagaya-ku, Tokyo 154-0022'

// Doc §1 "Clinic Hours (from Hero)": morning Mon–Sat open / Sun closed;
// afternoon Mon, Tue, Thu, Fri open / Wed, Sat, Sun closed.
const HERO_HOURS = [
  { ja: '月', en: 'Mon', morningOpen: true, afternoonOpen: true },
  { ja: '火', en: 'Tue', morningOpen: true, afternoonOpen: true },
  { ja: '水', en: 'Wed', morningOpen: true, afternoonOpen: false },
  { ja: '木', en: 'Thu', morningOpen: true, afternoonOpen: true },
  { ja: '金', en: 'Fri', morningOpen: true, afternoonOpen: true },
  { ja: '土', en: 'Sat', morningOpen: true, afternoonOpen: false },
  { ja: '日', en: 'Sun', morningOpen: false, afternoonOpen: false },
]

// Doc §4 "Treatment Categories" (ja: 「施術カテゴリ」). The services-grid
// component renders only `title` (plus an auto-assigned icon) for these six
// cards; `cta.label`/`cta.href` are schema-required, so they carry the
// component's own default destination rather than invented copy.
const TREATMENT_CATEGORIES = [
  { ja: '整骨・整体施術', en: 'Osteopathic Treatment' },
  { ja: 'スポーツ外傷', en: 'Sports Injuries' },
  { ja: '姿勢・動作改善', en: 'Posture & Movement' },
  { ja: 'リハビリテーション', en: 'Rehabilitation' },
  { ja: '痛みの緩和', en: 'Pain Relief' },
  { ja: '交通事故などのケガのケア', en: 'Accident Care' },
]

const MISSION_BODY_JA = [
  'さくら整骨院では、良いケアはまず「聴くこと」から始まると考えています。',
  '一人ひとりの体・生活スタイル・お悩みは異なります。だからこそ、じっくりとお話を伺い、その方に合ったケアを提供します。',
  '私たちの目標は、痛みを和らげるだけでなく、快適に動けるようになり、自信を持って毎日を楽しんでいただけることです。',
  'あなたの健康、快適さ、そして日常を、私たちは全力でサポートします。',
].join('\n\n')

const MISSION_BODY_EN = [
  'At Sakura Osteopathic Clinic, we believe that good care begins with listening.',
  'Every person has a different body, lifestyle, and concern. That is why we take the time to understand how you feel and provide care that is suited to your individual needs.',
  'Our goal is not only to help relieve pain, but also to help you move comfortably and enjoy your everyday life with confidence.',
  'Your health, your comfort, your everyday life — we are here to support you.',
].join('\n\n')

// `mission-statement` marks visionHeading/visionBody `required: true`, but its
// component (packages/cms-core/src/blocks/mission-statement/component.tsx)
// destructures only missionHeading/missionBody/photos — the vision pair is
// never rendered. The doc has no vision content, so these carry an explicit
// placeholder to satisfy the schema. Flagged in the handover report.
const VISION_PLACEHOLDER_JA = '（未設定 — 内容が決まり次第、管理画面で入力してください）'
const VISION_PLACEHOLDER_EN = '(Not set — fill this in from the admin panel once the copy is decided.)'

function buildLayout(locale: 'ja' | 'en', doctorIds: string[], departmentIds: string[]) {
  const t = <T,>(ja: T, en: T): T => (locale === 'ja' ? ja : en)

  return [
    // ── 1. Hero (doc §1) ────────────────────────────────────────────
    {
      blockType: 'hero',
      headline: t('より良く感じ、より良く動き、より良く生きる', 'Feel better, move better, live better'),
      subheadline: t(
        '快適に動き、自信を持って毎日を送れるよう、あなたに合わせたケアを提供します。',
        'Personalized care to help you move comfortably and live with confidence.',
      ),
      hoursTable: {
        morningLabel: '9:00 – 12:30',
        afternoonLabel: '14:30 – 18:00',
        rows: HERO_HOURS.map((row) => ({
          day: t(row.ja, row.en),
          morningOpen: row.morningOpen,
          afternoonOpen: row.afternoonOpen,
        })),
      },
      notes: [
        { text: t('水曜・土曜は13:00まで', 'Wednesdays & Saturdays: open until 1:00 PM') },
        { text: t('臨時休診となる場合があります。', 'Temporary closures may occur.') },
      ],
      address: {
        line: t(ADDRESS_JA, ADDRESS_EN),
      },
      firstVisitCard: {
        heading: t('初めての方へ', 'FOR FIRST-TIME VISITORS'),
        description: t(
          '新規の患者さまを歓迎いたします。初回のご相談もお気軽にどうぞ。',
          'We welcome new patients! Feel free to consult with us for your first visit.',
        ),
        // The component renders the "→" itself.
        linkLabel: t('初めての方はこちら', 'First-time visitors, click here'),
      },
      showScrollIndicator: true,
    },

    // ── 2. News List (doc §2) ───────────────────────────────────────
    // Items come from the `news` collection (see ../news.ts); the root route
    // resolves the latest ones at render time. The doc gives no eyebrow,
    // heading or intro for this section, so all three are left unset.
    {
      blockType: 'news-list',
      layout: 'list',
      source: 'collection',
      count: 3,
    },

    // ── 3. Mission Statement (doc §3) ───────────────────────────────
    {
      blockType: 'mission-statement',
      missionHeading: t(
        '痛みを乗り越え、より快適に動けるようになり、あなたが大切にする日常を取り戻すお手伝いをします。',
        "We're here to help you overcome pain, move more comfortably, and get back to the life you love.",
      ),
      missionBody: t(MISSION_BODY_JA, MISSION_BODY_EN),
      visionHeading: t(VISION_PLACEHOLDER_JA, VISION_PLACEHOLDER_EN),
      visionBody: t(VISION_PLACEHOLDER_JA, VISION_PLACEHOLDER_EN),
    },

    // ── 4. Services Grid (doc §4 "Treatment Details") ───────────────
    // The component maps `eyebrow` to the section's <h2> and `heading` to the
    // paragraph beneath it, so the doc's "Treatment Details" title and its
    // intro paragraph go in that order. The doc's "Symptoms & Concerns"
    // sub-section (its 8 numbered items and their intro) has no CMS field at
    // all — it is hardcoded in the component. Flagged in the handover report.
    {
      blockType: 'services-grid',
      eyebrow: t('施術内容', 'Treatment Details'),
      heading: t(
        '痛みの軽減、可動性の向上、自信を持って日常に戻れるよう、一人ひとりに合わせた施術を提供しています。日常的な体の不調からスポーツ外傷・リハビリまで、患者さまの状態に寄り添ったケアを行います。',
        "We offer a range of personalized treatments designed to help you manage pain, improve mobility, and return to your everyday activities with confidence. From common body aches to sports injuries and rehabilitation, our care is tailored to each patient's needs.",
      ),
      layout: 'alternating',
      services: TREATMENT_CATEGORIES.map((category) => ({
        title: t(category.ja, category.en),
        cta: { label: t('詳しく見る', 'View details'), href: '/services' },
      })),
    },

    // ── 5. Department List / Features of Our Clinic (doc §5) ────────
    {
      blockType: 'department-list',
      heading: t('特徴・部門一覧', 'Features of Our Clinic'),
      departments: departmentIds,
      columns: '3',
    },

    // ── 6. Doctor Grid (doc §6) ─────────────────────────────────────
    {
      blockType: 'doctor-grid',
      subheadline: t(
        'さくら整骨院のチームは、すべての患者さまに快適で温かい体験をお届けすることを大切にしています。丁寧にお話を伺い、思いやりのあるケアを提供し、より良い健康と動きへの道のりをサポートします。',
        'At Sakura Osteopathic Clinic, our team is committed to creating a comfortable and welcoming experience for every patient. We listen carefully, provide thoughtful care, and support you throughout your journey toward better health and movement.',
      ),
      doctors: doctorIds,
      columns: '3',
      showBio: false,
    },

    // ── 7. Hours & Location (doc §7) ────────────────────────────────
    // Address, phone, map and the hours table are injected from site.config.ts
    // by the root route — this block only carries the heading and toggles.
    {
      blockType: 'hours-location',
      sectionHeading: t('診療時間・アクセス', 'Hours & Location'),
      showMap: true,
      showHours: true,
      showAddress: true,
      showPhone: true,
    },
  ]
}

export async function seedDemoHomePage(
  payload: Payload,
  doctorIds: string[],
  departmentIds: string[],
): Promise<void> {
  await createLocalizedDoc(payload, 'pages', {
    ja: {
      title: 'ホーム',
      slug: 'home',
      meta: {
        title: 'さくら整骨院 | 東京都世田谷区の整骨院',
        description:
          '快適に動き、自信を持って毎日を送れるよう、あなたに合わせたケアを提供します。さくら整骨院は東京都世田谷区梅丘の整骨院です。',
      },
      layout: buildLayout('ja', doctorIds, departmentIds),
    },
    en: {
      title: 'Home',
      meta: {
        title: 'Sakura Osteopathic Clinic | Setagaya, Tokyo',
        description:
          'Personalized care to help you move comfortably and live with confidence. Sakura Osteopathic Clinic is located in Umegaoka, Setagaya-ku, Tokyo.',
      },
      layout: buildLayout('en', doctorIds, departmentIds),
    },
  })
}
