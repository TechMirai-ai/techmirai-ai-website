import siteConfig from '../../site.config'
import { LEGAL_PAGE_META } from './seo/page-meta'

// Pack-4/M1: the three legal pages. Headings are the Spec §18 "Legal page
// headings" table (p.111), verbatim; legal-headings.test.ts re-reads the Spec
// and fails on any drift. CLAUDE.md rule 7: no legal wording is written here —
// every section carries only the approved placeholder, plus a confirmed config
// fact where one exists (business name, email). The phone is deliberately NOT
// shown: the configured number is an unconfirmed placeholder (Jamal, M1 decision 2).

export type LegalLocale = 'en' | 'ja'
export type LegalPageKey = 'privacy' | 'terms' | 'legalNotice'
type ConfirmedFact = 'businessName' | 'email'

/** Approved placeholders (Jamal, 2026-10-15) — used verbatim under every heading. */
export const LEGAL_PLACEHOLDER: Readonly<Record<LegalLocale, string>> = {
  en: '[PLACEHOLDER: wording to be written by a professional. Do not launch with this text.]',
  ja: '専門家による文案作成が必要です。この文章のまま公開しないでください。',
}

interface LegalSectionDef {
  heading: Readonly<Record<LegalLocale, string>>
  fact?: ConfirmedFact
}

interface LegalPageDef {
  path: '/privacy' | '/terms' | '/legal-notice'
  sections: readonly LegalSectionDef[]
}

export const LEGAL_PAGES: Readonly<Record<LegalPageKey, LegalPageDef>> = {
  privacy: {
    path: '/privacy',
    sections: [
      { heading: { en: 'Business information', ja: '事業者情報' }, fact: 'businessName' },
      { heading: { en: 'Information we collect', ja: '取得する情報' } },
      { heading: { en: 'Purposes of use', ja: '利用目的' } },
      { heading: { en: 'Outside services', ja: '業務委託先' } },
      { heading: { en: 'Data outside Japan', ja: '外国にある第三者への提供' } },
      { heading: { en: 'Security measures', ja: '安全管理措置' } },
      { heading: { en: 'Your requests', ja: '開示等のご請求' } },
      { heading: { en: 'Contact', ja: 'お問い合わせ窓口' }, fact: 'email' },
      { heading: { en: 'Updates', ja: '改定' } },
    ],
  },
  terms: {
    path: '/terms',
    sections: [
      { heading: { en: 'Scope', ja: '適用範囲' } },
      { heading: { en: 'Content and copyright', ja: 'コンテンツと著作権' } },
      { heading: { en: 'Prohibited acts', ja: '禁止事項' } },
      { heading: { en: 'Disclaimer', ja: '免責事項' } },
      { heading: { en: 'Changes', ja: '変更' } },
      { heading: { en: 'Governing law', ja: '準拠法' } },
    ],
  },
  legalNotice: {
    path: '/legal-notice',
    sections: [
      { heading: { en: 'Seller', ja: '販売事業者' }, fact: 'businessName' },
      { heading: { en: 'Representative', ja: '代表者' } },
      { heading: { en: 'Address', ja: '所在地' } },
      { heading: { en: 'Phone', ja: '電話番号' } },
      { heading: { en: 'Email', ja: 'メールアドレス' }, fact: 'email' },
      { heading: { en: 'Prices', ja: '販売価格' } },
      { heading: { en: 'Other fees', ja: '商品代金以外の必要料金' } },
      { heading: { en: 'Payment', ja: '支払方法' } },
      { heading: { en: 'Delivery', ja: '提供時期' } },
      { heading: { en: 'Cancellation', ja: '解約について' } },
    ],
  },
}

function confirmedFactValue(fact: ConfirmedFact): string {
  return fact === 'businessName' ? siteConfig.site.name : siteConfig.contact.email
}

export interface LegalSectionContent {
  heading: string
  /** A confirmed config fact, shown as-is (never legal wording). */
  fact?: string
  placeholder: string
}

export interface LegalPageContent {
  title: string
  sections: LegalSectionContent[]
}

/** Everything a legal page renders, in one locale — nothing else appears on it. */
export function legalPageContent(page: LegalPageKey, locale: string): LegalPageContent {
  const lang: LegalLocale = locale === 'en' ? 'en' : 'ja'
  const def = LEGAL_PAGES[page]
  return {
    title: LEGAL_PAGE_META[def.path]![lang].title,
    sections: def.sections.map((section) => ({
      heading: section.heading[lang],
      ...(section.fact ? { fact: confirmedFactValue(section.fact) } : {}),
      placeholder: LEGAL_PLACEHOLDER[lang],
    })),
  }
}
