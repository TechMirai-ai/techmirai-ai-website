import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { SPEC_ALT, type ImageAlt } from '../lib/image-slots'
import { createInitialsAvatarPng } from './lib/placeholder-image'
import { richText } from './lib/rich-text'
import { upsertMedia } from './media'

export interface TeamIds {
  jamal: string | number
  abdullah: string | number
  haruka: string | number
  nahida: string | number
  newEngineer: string | number
}

interface TeamSeedInput {
  slug: string
  photoFilename: string
  /** Spec p.113 alt text, where the Spec gives one (Jamal, Haruka). */
  portraitAlt?: ImageAlt
  initials: string
  en: { name: string; title: string; shortBio: string; bio?: string[] }
  ja: { name: string; title: string; shortBio: string; bio?: string[] }
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
  const photo = await upsertMedia(
    payload,
    input.photoFilename,
    buffer,
    input.portraitAlt ?? {
      en: `Placeholder portrait for ${input.en.name} — real photo pending written consent (F1-15)`,
      ja: '[JA TODO]',
    },
  )

  const doc = await createLocalizedDoc(payload, 'team', {
    en: {
      name: input.en.name,
      title: input.en.title,
      shortBio: input.en.shortBio,
      ...(input.en.bio ? { bio: richText(...input.en.bio) } : {}),
      photo,
      slug: input.slug,
      visible: true,
      sortOrder: input.sortOrder,
    },
    ja: {
      name: input.ja.name,
      title: input.ja.title,
      shortBio: input.ja.shortBio,
      ...(input.ja.bio ? { bio: richText(...input.ja.bio) } : {}),
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
    portraitAlt: SPEC_ALT.jamalPortrait,
    initials: 'JS',
    en: {
      name: 'Jamal Shah',
      title: 'Founder',
      shortBio: "Master's in software engineering. Builds the AI and the systems behind AI受付.",
      // Spec §10.4 full bio, verbatim — bracket kept per CLAUDE.md rule 5.
      bio: [
        "Born in Bangladesh, studied in Egypt and India, and has lived in Japan for [about seven years]. Master's in software engineering from a Japanese university. Has worked on deep learning, computer vision and voice AI in Japanese corporate research and manufacturing. Speaks five languages. Designs the AI and systems behind AI受付.",
      ],
    },
    ja: {
      name: 'ジャマル・シャー',
      title: '代表 (representative)',
      shortBio: 'ソフトウェア工学修士。AI受付を支えるAIとシステムを設計しています。',
      bio: [
        'バングラデシュ生まれ。エジプトとインドで学び、日本在住は[約7年]。日本の大学院でソフトウェア工学の修士号を取得。日本企業の研究開発や製造の現場で、ディープラーニング、画像認識、音声AIに携わってきました。5か国語を話します。AI受付を支えるAIとシステムを設計しています。',
      ],
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
      bio: [
        'Twelve years in Japanese industry. An engineering manager in Japan, and an early engineer at a Japanese startup that went on to succeed.',
      ],
    },
    ja: {
      name: 'アブドゥッラー・アル・マルフ',
      title: '共同創業者 (co-founder)',
      shortBio: '日本の産業界で12年。エンジニアリングマネジメントの経験を持ちます。',
      bio: [
        '日本の産業界で12年。日本でエンジニアリングマネージャーを務め、のちに大きく成長した日本のスタートアップに、初期のエンジニアとして参画しました。',
      ],
    },
    sortOrder: 2,
  })

  const haruka = await upsertTeamMember(payload, {
    slug: 'haruka-fujimori',
    photoFilename: 'placeholder-team-haruka.png',
    portraitAlt: SPEC_ALT.harukaPortrait,
    initials: 'HF',
    en: {
      name: 'Haruka Fujimori',
      title: 'Sales & Client Relations',
      shortBio: 'Your first point of contact, in Japanese or English.',
      bio: [
        'Bilingual in Japanese and English, with experience in interpreting, translation and client-facing communication. Leads client relationships and coordination with Japanese businesses, and is your first point of contact.',
      ],
    },
    ja: {
      // Spec gives this literally bracketed — never machine-translate/edit (CLAUDE.md rule 6).
      name: '[藤森 はるか]',
      title: '営業・お客様窓口 (sales and client contact)',
      shortBio: '日本語・英語での、最初のご相談窓口です。',
      bio: [
        '日本語・英語のバイリンガル。通訳・翻訳とお客様対応の経験を活かし、日本のお客様とのやり取りを担当しています。はじめてのご相談窓口です。',
      ],
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
      bio: [
        'Three years building production web and AI systems. Works across the booking engine, LINE integration and reception system behind the demo.',
      ],
    },
    ja: {
      name: 'ナヒダ・ラーマン',
      title: 'エンジニア',
      shortBio: '予約エンジン、LINE連携、受付システムを開発しています。',
      bio: [
        '本番環境で動くWeb・AIシステムの開発に3年間携わってきました。デモを支える予約エンジン、LINE連携、受付システムを開発しています。',
      ],
    },
    sortOrder: 4,
  })

  // Spec §10.4's own 5th row: a deliberate placeholder for a not-yet-hired
  // person, not a real team member awaiting consent (distinct from F1-15's
  // consent gate on the 4 real people above) — registered as I2-06.
  const newEngineer = await upsertTeamMember(payload, {
    slug: 'new-engineer',
    photoFilename: 'placeholder-team-new-engineer.png',
    initials: 'NE',
    en: {
      name: '[New engineer]',
      title: 'Engineer',
      shortBio: '[Name and one line, when ready]',
      bio: ['[Name and one line, when ready]'],
    },
    ja: {
      // Spec gives one bracket token for the name (not a separate EN/JA
      // translation pair) — kept identical in both locales, per CLAUDE.md
      // rule 5. Title reuses Nahida's exact JA term above.
      name: '[New engineer]',
      title: 'エンジニア',
      shortBio: '[お名前と一言、準備でき次第]',
      bio: ['[お名前と一言、準備でき次第]'],
    },
    sortOrder: 5,
  })

  payload.logger.info('🧑‍🤝‍🧑 Team seeded (Spec §5.11/§10.4, 5 people)')
  return { jamal, abdullah, haruka, nahida, newEngineer }
}
