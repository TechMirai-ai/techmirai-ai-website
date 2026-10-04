import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { richText } from './lib/rich-text'

/**
 * Content source: Sakura_Homepage_Content_List.docx §6, sub-section
 * "Front-Desk / Support Team (separate from doctors)"
 * (ja: 「受付・サポートスタッフ（施術者とは別に記載）」).
 *
 * These two people are deliberately present in BOTH this collection and the
 * `doctors` collection. The doc lists them under the Doctor Grid section, and
 * the doctor-grid component is the only thing that renders them on the
 * homepage; this collection is what the /team route reads. The `team-grid`
 * block is not usable as a second home for them — its component
 * (packages/cms-core/src/blocks/team-grid/component.tsx) is a stub that
 * renders an empty <div>.
 *
 * Bios are generic placeholders for the same reason as in doctors.ts, and
 * `photo` is left unset for manual upload.
 */
const MEMBERS = [
  {
    ja: {
      name: '山本 健太',
      title: '受付・患者サポート',
      bio: '受付にて、ご予約からご来院までのご案内を担当しています。（紹介文は仮のものです。正式な内容は後ほど差し替えてください。）',
    },
    en: {
      name: 'Kenta Yamamoto',
      title: 'Reception & Patient Support',
      bio: 'Kenta looks after the front desk, guiding patients from booking through to their visit. (Placeholder bio — to be replaced with the final text.)',
    },
  },
  {
    ja: {
      name: '鈴木 愛',
      title: 'ケアサポートスタッフ',
      bio: '患者さまが快適に過ごせるよう、院内でのサポートを担当しています。（紹介文は仮のものです。正式な内容は後ほど差し替えてください。）',
    },
    en: {
      name: 'Ai Suzuki',
      title: 'Care Support Staff',
      bio: 'Ai supports patients throughout their time at the clinic so every visit feels comfortable. (Placeholder bio — to be replaced with the final text.)',
    },
  },
]

export async function seedDemoTeam(payload: Payload): Promise<string[]> {
  const ids: string[] = []
  for (const [i, member] of MEMBERS.entries()) {
    const doc = await createLocalizedDoc<{ id: string }>(payload, 'team', {
      ja: {
        name: member.ja.name,
        title: member.ja.title,
        bio: richText(member.ja.bio),
        slug: `demo-team-${i + 1}`,
        featured: true,
        sortOrder: i + 1,
        aiVisible: true,
      },
      en: {
        name: member.en.name,
        title: member.en.title,
        bio: richText(member.en.bio),
      },
    })
    ids.push(doc.id)
  }
  return ids
}
