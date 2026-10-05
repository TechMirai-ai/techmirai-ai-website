// Pack-2/E2: the one shared EN/JA labels dictionary (Content Spec §4,
// "Global buttons and labels"). Components that need these exact strings
// should import from here instead of rolling their own inline dict.
export interface Labels {
  primaryCta: string
  demoCta: string
  lineAdd: string
  lineAsk: string
  phone: string
  brochure: string
  readMore: string
  backToTop: string
  trustLine: string
  statusAvailable: string
  statusInDevelopment: string
}

export const LABELS: Record<'en' | 'ja', Labels> = {
  en: {
    primaryCta: 'Get a free AI website assessment',
    demoCta: 'Try the live demo',
    lineAdd: 'Add us on LINE',
    lineAsk: 'Ask us on LINE',
    phone: 'Call us',
    brochure: 'Download the brochure (PDF)',
    readMore: 'Read more',
    backToTop: 'Back to top',
    trustLine: 'Japanese-language support · Free · No pushy follow-up',
    statusAvailable: 'Available now',
    statusInDevelopment: 'In development',
  },
  ja: {
    primaryCta: '無料AIホームページ診断を申し込む',
    demoCta: 'デモを体験する',
    lineAdd: 'LINEで友だち追加',
    lineAsk: 'LINEで相談する',
    phone: '電話で相談する',
    brochure: '資料をダウンロード（PDF）',
    readMore: '詳しく見る',
    backToTop: 'ページの先頭へ',
    trustLine: '日本語でご相談いただけます・無料・しつこい営業はいたしません',
    statusAvailable: '提供中',
    statusInDevelopment: '開発中',
  },
}

export function getLabels(locale: string): Labels {
  return LABELS[locale === 'ja' ? 'ja' : 'en']
}
