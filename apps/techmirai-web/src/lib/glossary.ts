// Pack-2/E2: the Content Spec's canonical terms (§3, "Glossary — use exactly
// these terms"). Components should pull these strings from here rather than
// inventing their own wording — e.g. always "Live demo", never "sample".
export interface GlossaryTerm {
  en: string
  ja: string
}

export const GLOSSARY = {
  productFamily: { en: 'AI受付 (AI Reception)', ja: 'AI受付' },
  webEdition: { en: 'AI受付 Web', ja: 'AI受付（Web）' },
  voiceEdition: { en: 'AI受付 Voice', ja: 'AI受付（電話）' },
  freeAssessment: { en: 'Free AI Website Assessment', ja: '無料AIホームページ診断' },
  liveDemo: { en: 'Live demo', ja: 'デモ体験' },
  receptionChat: { en: 'Reception chat', ja: '受付チャット' },
  humanHandoff: { en: 'Handoff to your staff', ja: 'スタッフへの引き継ぎ' },
  reservation: { en: 'Reservation / booking', ja: '予約' },
  changesAndCancellations: { en: 'Changes and cancellations', ja: '予約の変更・キャンセル' },
  reminder: { en: 'Reminder', ja: 'リマインド通知' },
  adminPanel: { en: 'Admin panel', ja: '管理画面' },
  approvedAnswers: { en: 'Your approved answers', ja: '承認済みの回答' },
  smallBusinesses: { en: 'Small businesses', ja: '中小企業・店舗' },
  multilingual: { en: 'Multilingual', ja: '多言語対応' },
  lineOfficialAccount: { en: 'LINE Official Account', ja: 'LINE公式アカウント' },
  socialMedia: { en: 'Social media', ja: 'SNS' },
  proofOfConcept: { en: 'AI proof of concept (PoC)', ja: 'AIのPoC（概念実証）' },
} as const satisfies Record<string, GlossaryTerm>

export type GlossaryKey = keyof typeof GLOSSARY

export function glossaryTerm(key: GlossaryKey, locale: string): string {
  return GLOSSARY[key][locale === 'ja' ? 'ja' : 'en']
}
