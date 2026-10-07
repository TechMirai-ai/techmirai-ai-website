import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { createInitialsAvatarPng } from './lib/placeholder-image'
import { upsertMedia } from './media'

export interface TeamIds {
  jamal: string | number
  abdullah: string | number
  haruka: string | number
  nahida: string | number
}

interface TeamSeedInput {
  slug: string
  photoFilename: string
  initials: string
  en: { name: string; title: string; shortBio: string }
  ja: { name: string; title: string; shortBio: string }
  sortOrder: number
}

/**
 * Pack-3/G4, Spec §5.11. Each person's `shortBio` is the Spec's one-liner,
 * distinct from the full `bio` richText which Pack-3/I2 (About) fills in
 * once each person approves it — see docs/FINDINGS.md's G4 note. Haruka's
 * JA name is seeded exactly as the Spec's bracketed form (CLAUDE.md rule 6);
 * see docs/PLACEHOLDER-REGISTER.md F1-16. Idempotent on re-run: `team.slug`
 * is unique, so each person is looked up by slug before creating.
 */
async function upsertTeamMember(payload: Payload, input: TeamSeedInput): Promise<string | number> {
  const existing = await payload.find({
    collection: 'team',
    where: { slug: { equals: input.slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0]['id'] as string | number

  const buffer = await createInitialsAvatarPng(input.initials, 1200)
  const photo = await upsertMedia(payload, input.photoFilename, buffer, {
    en: `Placeholder portrait for ${input.en.name} — real photo pending written consent (F1-15)`,
    ja: '[JA TODO]',
  })

  const doc = await createLocalizedDoc(payload, 'team', {
    en: {
      name: input.en.name,
      title: input.en.title,
      shortBio: input.en.shortBio,
      photo,
      slug: input.slug,
      visible: true,
      sortOrder: input.sortOrder,
    },
    ja: {
      name: input.ja.name,
      title: input.ja.title,
      shortBio: input.ja.shortBio,
      photo,
      slug: input.slug,
      visible: true,
      sortOrder: input.sortOrder,
    },
  })
  return (doc as { id: string | number }).id
}

export async function seedTeam(payload: Payload): Promise<TeamIds> {
  const jamal = await upsertTeamMember(payload, {
    slug: 'jamal-shah',
    photoFilename: 'placeholder-team-jamal.png',
    initials: 'JS',
    en: {
      name: 'Jamal Shah',
      title: 'Founder',
      shortBio: "Master's in software engineering. Builds the AI and the systems behind AI受付.",
    },
    ja: {
      name: 'ジャマル・シャー',
      title: '代表 (representative)',
      shortBio: 'ソフトウェア工学修士。AI受付を支えるAIとシステムを設計しています。',
    },
    sortOrder: 1,
  })

  const abdullah = await upsertTeamMember(payload, {
    slug: 'abdullah-al-maruf',
    photoFilename: 'placeholder-team-abdullah.png',
    initials: 'AM',
    en: {
      name: 'Abdullah Al Maruf',
      title: 'Co-founder',
      shortBio: 'Twelve years in Japanese industry, including engineering management.',
    },
    ja: {
      name: 'アブドゥッラー・アル・マルフ',
      title: '共同創業者 (co-founder)',
      shortBio: '日本の産業界で12年。エンジニアリングマネジメントの経験を持ちます。',
    },
    sortOrder: 2,
  })

  const haruka = await upsertTeamMember(payload, {
    slug: 'haruka-fujimori',
    photoFilename: 'placeholder-team-haruka.png',
    initials: 'HF',
    en: {
      name: 'Haruka Fujimori',
      title: 'Sales & Client Relations',
      shortBio: 'Your first point of contact, in Japanese or English.',
    },
    ja: {
      // Spec gives this literally bracketed — never machine-translate/edit (CLAUDE.md rule 6).
      name: '[藤森 はるか]',
      title: '営業・お客様窓口 (sales and client contact)',
      shortBio: '日本語・英語での、最初のご相談窓口です。',
    },
    sortOrder: 3,
  })

  const nahida = await upsertTeamMember(payload, {
    slug: 'nahida-rahaman',
    photoFilename: 'placeholder-team-nahida.png',
    initials: 'NR',
    en: {
      name: 'Nahida Rahaman',
      title: 'Engineer',
      shortBio: 'Builds the booking engine, LINE integration and reception system.',
    },
    ja: {
      name: 'ナヒダ・ラーマン',
      title: 'エンジニア',
      shortBio: '予約エンジン、LINE連携、受付システムを開発しています。',
    },
    sortOrder: 4,
  })

  payload.logger.info('🧑‍🤝‍🧑 Team seeded (Spec §5.11, 4 people)')
  return { jamal, abdullah, haruka, nahida }
}
