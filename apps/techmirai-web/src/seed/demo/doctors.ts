import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { richText } from './lib/rich-text'

/**
 * Content source: Sakura_Homepage_Content_List.docx §6 "Doctor Grid"
 * (ja: 「6. スタッフ紹介」) — names, roles, experience and tags transcribed
 * verbatim.
 *
 * All four people live in this collection because the `doctor-grid` block is
 * the only renderer for them: its component lays out doctors[0] as the large
 * "Director" card and doctors[1..3] as the three smaller staff cards, and the
 * doc's own note that Ai Suzuki's card reads "Know more about Ai Suzuki →"
 * matches that component's staff-card hover text exactly. The two front-desk
 * staff are ALSO seeded into the `team` collection (see team.ts), which is
 * what the /team route reads.
 *
 * `bio` here is a deliberately generic placeholder: the doc supplies no bio
 * text for anyone ("紹介文：（画像に詳細な紹介文の記載なし。）"), so these are
 * written to be obviously fillable-later and claim no credentials or medical
 * specialisation beyond the role the doc states. `photo` is intentionally left
 * unset — images are being attached by hand in the admin.
 */
const PEOPLE = [
  {
    // Doc §6 tags: "Experienced & Professional Care · Support From Treatment to
    // Recovery" — these are department (services collection) entries 1 and 2.
    departments: [0, 1],
    years: 16,
    ja: {
      name: '田中 大輔',
      title: '院長',
      bio: '院長として、患者さま一人ひとりのお話をじっくり伺うことを大切にしています。（紹介文は仮のものです。正式な内容は後ほど差し替えてください。）',
    },
    en: {
      name: 'Daisuke Tanaka',
      title: 'Clinic Director',
      bio: 'As Clinic Director, Daisuke takes the time to listen to each patient before recommending care. (Placeholder bio — to be replaced with the final text.)',
    },
  },
  {
    departments: [],
    ja: {
      name: '佐藤 美咲',
      title: '整骨院施術者',
      bio: '施術者として、患者さまが安心して過ごせる時間づくりを心がけています。（紹介文は仮のものです。正式な内容は後ほど差し替えてください。）',
    },
    en: {
      name: 'Misaki Sato',
      title: 'Osteopathic Practitioner',
      bio: 'Misaki focuses on making every treatment session a calm and reassuring experience. (Placeholder bio — to be replaced with the final text.)',
    },
  },
  {
    departments: [],
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
    departments: [],
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

export async function seedDemoDoctors(payload: Payload, departmentIds: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const [i, person] of PEOPLE.entries()) {
    const doc = await createLocalizedDoc<{ id: string }>(payload, 'doctors', {
      ja: {
        name: person.ja.name,
        title: person.ja.title,
        specialties: person.departments.map((d) => departmentIds[d]!),
        bio: richText(person.ja.bio),
        ...(person.years !== undefined ? { yearsOfExperience: person.years } : {}),
        slug: `demo-practitioner-${i + 1}`,
        sortOrder: i + 1,
        active: true,
        aiVisible: true,
      },
      en: {
        name: person.en.name,
        title: person.en.title,
        bio: richText(person.en.bio),
      },
    })
    ids.push(doc.id)
  }
  return ids
}
