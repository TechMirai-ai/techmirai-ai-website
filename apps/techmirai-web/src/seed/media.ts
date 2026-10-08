import type { Payload } from 'payload'
import { createInitialsAvatarPng, createLabelledPlaceholderPng, paletteColor } from './lib/placeholder-image'

export interface MediaIds {
  ogImages: Record<string, number | string>
  teamGroupPhoto: number | string
  individualPortrait: number | string
  heroPhoneMockup: number | string
  partnerPhoto: number | string
}

/**
 * Uploads a generated buffer as a `media` doc, reusing an existing doc with
 * the same filename instead of creating a duplicate. This is the
 * Pack-2/F3 fix for the "reseeding orphans media" risk flagged in
 * docs/packs/PACK-2-FOUNDATION.md's F3 step: stable filenames mean a
 * re-upload after a failed/partial clear would otherwise get silently
 * suffixed (`-1.png`) by the storage adapter rather than reused — logged in
 * docs/ENGINE-FIXES.md.
 */
export async function upsertMedia(
  payload: Payload,
  filename: string,
  buffer: Buffer,
  alt: { en: string; ja: string },
  mimetype = 'image/png',
): Promise<number | string> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    return existing.docs[0]['id'] as number | string
  }

  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (payload as any).create({
    collection: 'media',
    data: { alt },
    file: { data: buffer, mimetype, name: filename, size: buffer.length },
    locale: 'all',
  })
  return doc.id as number | string
}

const PAGE_LABELS: Record<string, { en: string; ja: string }> = {
  home: { en: 'Home', ja: '[JA TODO]' },
  'ai-reception': { en: 'AI Reception', ja: 'AI受付' },
  solutions: { en: 'Solutions', ja: '業種別' },
  clinic: { en: 'Clinics & treatment rooms', ja: 'クリニック・治療院' },
  beauty: { en: 'Beauty salons', ja: '美容サロン' },
  automobile: { en: 'Auto service & dealers', ja: '自動車整備・販売' },
  hotel: { en: 'Hotels & guesthouses', ja: 'ホテル・宿泊施設' },
  'how-it-works': { en: 'How It Works', ja: '仕組み' },
  integrations: { en: 'Integrations', ja: '連携' },
  pricing: { en: 'Pricing', ja: '料金' },
  security: { en: 'Security', ja: '[JA TODO]' },
  about: { en: 'About', ja: '会社紹介' },
  technology: { en: 'Technology', ja: 'AI開発' },
  assessment: { en: 'Free AI Website Assessment', ja: '無料AIホームページ診断' },
  faq: { en: 'FAQ', ja: 'よくあるご質問' },
  privacy: { en: 'Privacy Policy', ja: '[JA TODO]' },
  terms: { en: 'Terms of Use', ja: '[JA TODO]' },
  'legal-notice': { en: 'Legal Notice', ja: '[JA TODO]' },
}

/**
 * Generates every placeholder image this seed needs, at the sizes Content
 * Spec §19 ("Photo and image brief") actually specifies — one 1200×630
 * social-share image per page (Spec §19's "one per page" rule), plus one
 * Spec-sized team-group (2400×1350) and individual-portrait (1200×1500)
 * placeholder. Visuals with no explicit Spec size (phone mockup, admin
 * screenshot, diagrams, sample report) are deliberately NOT generated here
 * — inventing a confident-looking size for them would violate CLAUDE.md's
 * "do not invent facts" rule; see docs/FINDINGS.md for that logged gap.
 * Each file gets a docs/PLACEHOLDER-REGISTER.md row (F3-01 onward).
 */
export async function seedMedia(payload: Payload): Promise<MediaIds> {
  payload.logger.info('🖼️  Generating placeholder images...')

  const ogImages: Record<string, number | string> = {}
  let colorIndex = 0
  for (const [slug, label] of Object.entries(PAGE_LABELS)) {
    const buffer = await createLabelledPlaceholderPng(1200, 630, `PLACEHOLDER: ${label.en} social share 1200×630`, {
      background: paletteColor(colorIndex++),
    })
    ogImages[slug] = await upsertMedia(payload, `og-${slug}.png`, buffer, {
      en: `Placeholder social-share image for the ${label.en} page`,
      ja: '[JA TODO]',
    })
  }
  payload.logger.info(`   ${Object.keys(ogImages).length} social-share images ready`)

  const teamGroupBuffer = await createLabelledPlaceholderPng(2400, 1350, 'PLACEHOLDER: Team group photo 2400×1350')
  const teamGroupPhoto = await upsertMedia(payload, 'placeholder-team-group.png', teamGroupBuffer, {
    en: 'Placeholder team group photo — real photo pending (Spec §19)',
    ja: '[JA TODO]',
  })

  const portraitBuffer = await createInitialsAvatarPng('?', 1200)
  const individualPortrait = await upsertMedia(payload, 'placeholder-team-portrait.png', portraitBuffer, {
    en: 'Placeholder individual portrait — real photo pending (Spec §19)',
    ja: '[JA TODO]',
  })

  // Pack-3/G4: the homepage team-grid's Partner card (Spec §5.11, Sadiatec /
  // Md. Sanaul Haque) gets its own named initials avatar, distinct from the
  // generic unlabelled `?` individualPortrait, for visual consistency next
  // to the 4 named team members' own avatars.
  const partnerPhotoBuffer = await createInitialsAvatarPng('SH', 1200)
  const partnerPhoto = await upsertMedia(payload, 'placeholder-partner-sanaul-haque.png', partnerPhotoBuffer, {
    en: 'Placeholder portrait for Sadiatec Co., Ltd. partner (Md. Sanaul Haque) — real photo pending',
    ja: '[JA TODO]',
  })

  payload.logger.info('   Team group + individual portrait placeholders ready')

  // Pack-3/G1: the homepage hero's phone-mockup image (Spec §5.1/§19) was
  // deliberately left unsized by F3 pending "Phase G knowing actual on-page
  // usage" (docs/PLACEHOLDER-REGISTER.md note after F3-16) — G1 is that
  // moment. 750×1334 is a standard phone-screenshot aspect ratio; the real
  // chat/booking/LINE screenshots this stands in for don't exist yet.
  const heroPhoneMockupBuffer = await createLabelledPlaceholderPng(750, 1334, 'PLACEHOLDER: Hero phone mockup 750×1334')
  const heroPhoneMockup = await upsertMedia(payload, 'placeholder-hero-phone-mockup.png', heroPhoneMockupBuffer, {
    en: 'AI受付 answering a question and confirming a booking on a smartphone',
    ja: 'スマートフォンでAI受付が質問に答え、予約を確定している画面',
  })
  payload.logger.info('   Hero phone-mockup placeholder ready')

  return { ogImages, teamGroupPhoto, individualPortrait, heroPhoneMockup, partnerPhoto }
}
