import { SOLUTIONS_PAGE_SLUGS } from '../solutions-slugs'

// Pack-4/L1: Spec §17.1 "Titles and meta descriptions", copied verbatim from
// the Spec's Markdown export (CLAUDE.md rule 6). Bracketed values (prices)
// stay bracketed per rule 5 — see docs/PLACEHOLDER-REGISTER.md L1-*.
// page-meta.test.ts re-reads the Spec file and fails on any drift.

export type MetaLocale = 'en' | 'ja'
export type LocalizedMeta = Readonly<Record<MetaLocale, { title: string; description: string }>>

/** Public page path (locale-less, '' for home) → Spec §17.1 row. */
export const PAGE_META: Readonly<Record<string, LocalizedMeta>> = {
  '': {
    en: {
      title: 'TechMirai AI受付 — Turn Your Website into a 24/7 AI Reception Desk',
      description: 'AI reception for small businesses in Japan. Answer questions, take bookings and connect LINE 24/7, in Japanese and English. Free AI website assessment.',
    },
    ja: {
      title: 'TechMirai AI受付｜ホームページを24時間働くAI受付に',
      description: '中小企業・店舗のためのAI受付。よくある質問への回答、予約受付、LINE連携を24時間、日本語・英語で。無料AIホームページ診断を受付中です。',
    },
  },
  '/ai-reception': {
    en: {
      title: 'AI受付: AI Reception for Your Website, LINE and Phone — TechMirai',
      description: 'Answers questions, takes reservations, connects LINE and hands customers to staff. Web edition available now; phone edition in development.',
    },
    ja: {
      title: 'AI受付｜質問対応・予約・LINE連携・スタッフへの引き継ぎ｜TechMirai',
      description: '質問に答え、予約を受け付け、LINEとつながり、大切なお問い合わせはスタッフへ。Web版は提供中、電話版は開発中です。',
    },
  },
  '/solutions': {
    en: {
      title: 'AI Reception by Industry — TechMirai',
      description: 'How AI受付 works for clinics, beauty salons, auto service shops and hotels in Japan.',
    },
    ja: {
      title: '業種別のAI受付活用｜TechMirai',
      description: 'クリニック・治療院、美容サロン、自動車整備、ホテルでのAI受付の使い方をご紹介します。',
    },
  },
  '/solutions/clinic': {
    en: {
      title: 'AI Reception for Clinics and Treatment Rooms — TechMirai',
      description: 'Fewer calls during treatment: bookings, first-visit questions and reminders handled by AI受付. No medical advice. Live demo.',
    },
    ja: {
      title: 'クリニック・治療院のAI受付｜予約と問い合わせ対応｜TechMirai',
      description: '受付だけ、AIに任せませんか。予約、初診のご質問、リマインドをAI受付が対応。医療的な助言は行いません。デモあり。',
    },
  },
  '/solutions/beauty': {
    en: {
      title: 'AI Reception for Beauty Salons — LINE Booking — TechMirai',
      description: 'Menu questions, LINE bookings and reminders handled while your hands are busy.',
    },
    ja: {
      title: '美容サロンのAI受付｜LINE予約とリマインド｜TechMirai',
      description: '施術中でも予約はちゃんと入る。メニューのご質問、LINE予約、リマインドをAI受付が対応します。',
    },
  },
  '/solutions/automobile': {
    en: {
      title: 'AI Reception for Auto Service and Dealers — TechMirai',
      description: 'Inspection and maintenance bookings, common questions and estimate requests, day and night.',
    },
    ja: {
      title: '自動車整備・販売店のAI受付｜車検・点検の予約｜TechMirai',
      description: '車検・点検のご予約、よくあるご質問、見積もり依頼の受付を、昼も夜もAI受付が承ります。',
    },
  },
  '/solutions/hotel': {
    en: {
      title: 'AI Reception for Hotels — Guest Questions in English, 24/7 — TechMirai',
      description: 'Check-in, luggage, parking and access questions answered in Japanese and English at any hour.',
    },
    ja: {
      title: 'ホテル・宿泊施設のAI受付｜日本語・英語で24時間対応｜TechMirai',
      description: 'チェックイン、荷物、駐車場、アクセスなどのご質問に、日本語・英語で24時間お答えします。',
    },
  },
  '/how-it-works': {
    en: {
      title: 'How AI受付 Works: Layered Answers and Setup — TechMirai',
      description: 'Buttons first, approved answers second, AI last, a person always available. Plus the six setup steps.',
    },
    ja: {
      title: 'AI受付の仕組みと導入の流れ｜TechMirai',
      description: 'ボタン、承認済みの回答、AI、そしてスタッフ。段階的に答える仕組みと、導入の6ステップをご紹介します。',
    },
  },
  '/integrations': {
    en: {
      title: 'Integrations: LINE, Booking Systems and More — TechMirai',
      description: 'Which tools AI受付 connects to now, which are case by case, and which are not offered.',
    },
    ja: {
      title: '連携｜LINE・予約システムなど｜TechMirai AI受付',
      description: '標準で対応するツール、個別にご相談いただくツール、対応していないものを正直にご紹介します。',
    },
  },
  '/pricing': {
    en: {
      title: 'Pricing: AI受付 Starter Package — TechMirai',
      description: 'Initial setup from [¥300,000], monthly from [¥30,000]. Exact quote after a free assessment.',
    },
    ja: {
      title: '料金｜AI受付 スタートパッケージ｜TechMirai',
      description: '初期費用[30万円]〜、月額[3万円]〜。正式なお見積りは無料診断のあとにご提示します。',
    },
  },
  '/security': {
    en: {
      title: 'Security and Support — TechMirai AI受付',
      description: 'How AI受付 keeps answers accurate, protects bookings and handles personal information.',
    },
    ja: {
      title: 'セキュリティとサポート｜TechMirai AI受付',
      description: '回答の正確さ、予約の保護、個人情報の取り扱い、サポート体制をご説明します。',
    },
  },
  '/about': {
    en: {
      title: 'About TechMirai — Team and Company',
      description: 'A small Japan-based team building AI reception for small businesses. Meet the team and our partner.',
    },
    ja: {
      title: '会社紹介｜TechMirai',
      description: '中小企業・店舗のためのAI受付をつくる、日本を拠点としたチームです。メンバーとパートナー企業をご紹介します。',
    },
  },
  '/technology': {
    en: {
      title: 'AI Proof of Concept: Vision, Voice and Document AI — TechMirai',
      description: 'Test your AI idea on your own data before full investment.',
    },
    ja: {
      title: 'AI開発・PoC（概念実証）｜画像・音声・文書AI｜TechMirai',
      description: '本格的な投資の前に、御社のデータでAIのアイデアを検証します。',
    },
  },
  '/assessment': {
    en: {
      title: 'Free AI Website Assessment — TechMirai',
      description: 'Send your URL and get a report on what AI受付 could handle for your business.',
    },
    ja: {
      title: '無料AIホームページ診断｜TechMirai',
      description: 'URLを送るだけで、AI受付で対応できることをまとめたレポートをお届けします。',
    },
  },
  '/case-studies/sadiatec': {
    en: {
      title: 'Case Study: Sadiatec — Multilingual Website with AI Chat — TechMirai',
      description: 'From WordPress to a custom site in three languages with an admin panel, AI chatbot and WhatsApp handoff.',
    },
    ja: {
      title: '導入事例：Sadiatec様｜多言語サイトとAIチャット｜TechMirai',
      description: 'WordPressから、3言語対応・管理画面・AIチャット・WhatsApp連携を備えた独自開発サイトへ。',
    },
  },
  '/faq': {
    en: {
      title: 'FAQ — TechMirai AI受付',
      description: 'Answers about AI受付: accuracy, setup, integrations, pricing and support.',
    },
    ja: {
      title: 'よくあるご質問｜TechMirai AI受付',
      description: '正確さ、導入、連携、料金、サポートなど、AI受付についてのご質問にお答えします。',
    },
  },
  '/blog': {
    en: {
      title: 'Insights: Front Desk, Booking and AI — TechMirai',
      description: 'Practical notes for small businesses on reception, booking, LINE and AI.',
    },
    ja: {
      title: 'コラム｜受付・予約・AIのヒント｜TechMirai',
      description: '中小企業・店舗の受付、予約、LINE、AIについて、わかりやすく実践的にお届けします。',
    },
  },
  '/contact': {
    en: {
      title: 'Contact — TechMirai',
      description: 'General, press and partnership inquiries.',
    },
    ja: {
      title: 'お問い合わせ｜TechMirai',
      description: '一般のお問い合わせ、取材、パートナーシップのご相談はこちら。',
    },
  },
}

/**
 * Spec §17.1 rows "Post 1"–"Post 3". No blog posts are seeded yet (seed/blog.ts
 * is a no-op), so there is no slug to key them by; whoever seeds the posts
 * uses these as each post's title/excerpt. Kept here so the whole §17.1 table
 * lives in one verified place.
 */
export const BLOG_POST_META: readonly LocalizedMeta[] = [
  {
    en: {
      title: '7 Signs Your Website Should Be Doing More — TechMirai',
      description: 'A seven-point self-check for small businesses, plus three free things to do this week.',
    },
    ja: {
      title: 'ホームページにもっと働いてもらうべき7つのサイン｜TechMirai',
      description: '受付の見直しどきを7項目でセルフチェック。今週からできる3つのこともご紹介します。',
    },
  },
  {
    en: {
      title: 'Can You Trust AI with Your Customers? — TechMirai',
      description: 'How a layered front desk keeps AI answers accurate, and five questions to ask any chatbot provider.',
    },
    ja: {
      title: 'AIにお客様対応を任せて大丈夫？｜TechMirai',
      description: '正確さを守る段階的な受付のしくみと、AIチャットボットを選ぶ前に確認したい5つの質問。',
    },
  },
  {
    en: {
      title: 'Serving Foreign Customers Without English-Speaking Staff — TechMirai',
      description: 'Five practical ways to serve foreign customers well, prepared before they arrive.',
    },
    ja: {
      title: '英語が話せなくても大丈夫。外国人のお客様に対応する5つの方法｜TechMirai',
      description: '英語が話せるスタッフがいなくても実践できる、外国人のお客様への5つの対応方法。',
    },
  },
]

/**
 * Legal pages have no §17.1 row. Titles are the Spec §4 page titles; the
 * descriptions are registered placeholders (L1-01), never invented copy.
 */
export const LEGAL_PAGE_META: Readonly<Record<string, LocalizedMeta>> = {
  '/privacy': {
    en: { title: 'Privacy Policy', description: '[TBD: Privacy Policy meta description — not in Spec §17.1]' },
    ja: { title: 'プライバシーポリシー', description: '[JA TODO]' },
  },
  '/terms': {
    en: { title: 'Terms of Use', description: '[TBD: Terms of Use meta description — not in Spec §17.1]' },
    ja: { title: '利用規約', description: '[JA TODO]' },
  },
  '/legal-notice': {
    en: { title: 'Legal Notice', description: '[TBD: Legal Notice meta description — not in Spec §17.1]' },
    ja: { title: '特定商取引法に基づく表記', description: '[JA TODO]' },
  },
}

/** Locale-less path for a `pages` collection slug ('' for home). */
export function pathForPageSlug(slug: string): string {
  if (slug === 'home') return ''
  if ((SOLUTIONS_PAGE_SLUGS as readonly string[]).includes(slug)) return `/solutions/${slug}`
  return `/${slug}`
}
