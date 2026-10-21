import type { LocalizedMeta } from './page-meta'

// Voice-pivot (docs/ECC MASTER PROMPT TechMirai Voice Website v2.md §12):
// unique titles and descriptions for the launch pages. This is a separate
// layer on purpose — page-meta.ts holds the old Spec §17.1 rows and is
// guarded by page-meta.test.ts, which this change must not touch
// (CLAUDE.md rule 14).
//
// Japanese: only text the prompt supplies is used (copied exactly); all other
// Japanese is "[JA TODO]" and is listed in docs/PLACEHOLDER-REGISTER.md.
const HERO_LABEL_JA = 'コールセンター・電話窓口向け AI音声エージェント'
const HERO_BODY_JA =
  '定型的な問い合わせ・混雑時・営業時間外の電話にAIが一次対応し、通話を記録・要約して、必要な対応はスタッフへ。コールセンター事業者様は、自社サービスとして提供できます。'

// DRAFT Japanese written at the owner's request (2026-10-21); native review
// required before launch (register V1-01).
const ja = {
  demo: {
    title: '音声デモ｜AI音声エージェントの通話対応を体験｜TechMirai',
    description:
      '営業時間外・混雑時・FAQの3つのシナリオで、AI音声エージェントの対応をシミュレーションで体験できます。文字起こしと要約はダッシュボード表示。事業者はすべて架空です。',
  },
  partners: {
    title: 'コールセンター向けホワイトラベル協業｜TechMirai',
    description:
      'コールセンター・BPO事業者様がAI音声エージェントを自社サービスとして提供するための、協業モデル、創設パートナープログラム、4ステップのPoCをご紹介します。',
  },
  company: {
    title: '会社情報｜国際的なエンジニアチーム｜TechMirai',
    description: 'AI音声エージェントを開発する国際的なエンジニアチームと、TechMiraiの会社概要をご紹介します。',
  },
  contact: {
    title: 'お問い合わせ｜AI音声エージェントの導入・協業のご相談｜TechMirai',
    description:
      'AI音声エージェントの導入、またはホワイトラベルでの協業についてご相談いただけます。同意のうえで送信できる短いフォームと、社内稟議用の概要資料をご用意しています。',
  },
  privacy: {
    title: 'プライバシーポリシー｜TechMirai',
    description: 'フォーム、デモの録音、文字起こしで取り扱う個人情報についての方針です。専門家による確認前のドラフトです。',
  },
} as const

/** Public path (locale-less, '' for home) → title/description. */
export const VOICE_META: Readonly<Record<string, LocalizedMeta>> = {
  '': {
    en: {
      title: 'TechMirai — AI Voice Agent for Call Centers and Phone Desks',
      description:
        'An AI voice agent that gives first-line response to routine, busy-time and after-hours calls, records and summarizes them, and passes what needs a person to staff. Offered to call centers as a white-label service.',
    },
    ja: { title: `TechMirai｜${HERO_LABEL_JA}`, description: HERO_BODY_JA },
  },
  '/demo': {
    en: {
      title: 'Voice Demo — See an AI Voice Agent Handle a Call | TechMirai',
      description:
        'A scripted simulation of an AI voice agent handling an after-hours, busy-time and FAQ call, with the transcript and summary in a dashboard view. Fictional businesses.',
    },
    ja: ja.demo,
  },
  '/partners': {
    en: {
      title: 'White-Label Partnership for Call Centers | TechMirai',
      description:
        'How call centers and BPO operators can offer an AI voice agent as their own service: the partnership model, founding partner program and a four-step proof of concept.',
    },
    ja: ja.partners,
  },
  '/company': {
    en: {
      title: 'Company — International Engineering Team | TechMirai',
      description: 'About TechMirai, the international engineering team behind the AI voice agent, and company profile.',
    },
    ja: ja.company,
  },
  '/contact': {
    en: {
      title: 'Contact — Consult About the AI Voice Agent or Partnership | TechMirai',
      description:
        'Consult TechMirai about adopting the AI voice agent or about a white-label partnership. Short form with consent, and an overview PDF for internal approval.',
    },
    ja: ja.contact,
  },
  '/privacy': {
    en: {
      title: 'Privacy Policy | TechMirai',
      description:
        'How TechMirai handles personal information from forms, demo recordings and transcriptions. Draft pending professional review.',
    },
    ja: ja.privacy,
  },
}
