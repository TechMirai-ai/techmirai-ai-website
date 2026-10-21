import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Pack-3/I3: /case-studies/sadiatec (Spec §13, lines 1111-1166 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Every
 * string below is copied verbatim from the Spec; brackets preserved exactly
 * per CLAUDE.md rule 5.
 *
 * This collection's own `visible` field (defaultValue false, documented in
 * `packages/cms-core/src/verticals/recruitment/collections/case-studies.ts`
 * as "requires Sadiatec's written permission (Spec §1 item 14)") IS the
 * page's visibility switch the I3 step prompt refers to — distinct from the
 * homepage teaser's own switch (`site.config.ts`'s
 * `sadiatecCaseStudyTeaserVisible`, also false). Per the approved I3 plan:
 *   - `visible: false` — the dedicated route
 *     (apps/techmirai-web/src/app/(frontend)/[locale]/case-studies/sadiatec/page.tsx)
 *     keeps rendering the existing ComingSoonStub while this is false, so no
 *     Sadiatec-identifying content is exposed before their written OK
 *     (docs/PLACEHOLDER-REGISTER.md F1-14).
 *   - `aiVisible: false` — the chatbot must not answer from this content
 *     either, for the same reason.
 *   - `publishedAt: 2026-07-31` — the Spec gives no publish date for this
 *     page, only the build period ("About 2 months (May–July 2026)"); this
 *     required schema field is used only as internal sort metadata and is
 *     never rendered as a displayed "published on" date anywhere on the
 *     page (confirmed in plan review).
 *
 * `challenge`/`solution`/`outcome`/`metricValue`/`metricCaption`/`results`
 * are deliberately left unset — none are required, and the Spec explicitly
 * forbids inventing results or metrics for this page. All real content
 * lives in `layout` instead (see the collection's own Pack-3/I3 comment for
 * why: those fields are shaped for a different, single-metric card type).
 *
 * "Before"/"What we built"/"What it means for Sadiatec" reuse
 * `security-points` (plain bulleted statements, no label/detail pairing
 * needed) — same block already used for similar flat lists on
 * `pages/security.ts` and `pages/how-it-works.ts`. "At a glance" reuses
 * `label-value-list` (label/detail pairs — the Spec's own
 * "Item | EN | JA" shape). The empty client-comment slot, "what came next"
 * and the pending-approval screenshots note share one more
 * `label-value-list`, since the Spec presents the first two as the same
 * flat "Element/EN/JA" shape used elsewhere, and the screenshots line
 * is this page's one placeholder-image note (CLAUDE.md rule 8 — a labelled
 * placeholder, never a generated image).
 *
 * The client-comment bracket is copied exactly as the Spec gives it and is
 * never drafted or paraphrased, per the Spec's own instruction ("Never
 * draft a quote for them").
 */
export async function seedCaseStudies(payload: Payload): Promise<void> {
  const enData = {
    title: 'Sadiatec Co., Ltd.: from WordPress to a custom multilingual website with AI chat',
    clientName: 'Sadiatec Co., Ltd.',
    industry: 'HR and recruitment support',
    tagline:
      'Sadiatec is an HR and recruitment support company. We rebuilt their website from the ground up in about two months, in three languages, with an admin panel their staff run themselves.',
    publishedAt: '2026-07-31T00:00:00.000Z',
    slug: 'sadiatec',
    active: true,
    visible: false,
    aiVisible: false,
    layout: [
      {
        blockType: 'page-hero',
        variant: 'hero',
        heading: 'Sadiatec Co., Ltd.: from WordPress to a custom multilingual website with AI chat',
        body:
          'Sadiatec is an HR and recruitment support company. We rebuilt their website from the ground up in about two months, in three languages, with an admin panel their staff run themselves.',
        textAlignment: 'left',
      },
      {
        blockType: 'label-value-list',
        heading: 'At a glance',
        rows: [
          { label: 'Client', detail: 'Sadiatec Co., Ltd.' },
          { label: 'Industry', detail: 'HR and recruitment support' },
          { label: 'Established', detail: '2005' },
          { label: 'Location', detail: 'Chiyoda-ku, Tokyo' },
          { label: 'Project', detail: 'New multilingual corporate website and content management system' },
          { label: 'Build period', detail: 'About 2 months (May–July 2026)' },
          { label: 'Scale', detail: 'About 20 pages · 3 languages · 11 content types · 7 integrations' },
        ],
      },
      {
        blockType: 'security-points',
        heading: 'Before',
        points: [
          { text: 'A WordPress website' },
          { text: 'Every content update needed an outside developer' },
          { text: 'No chatbot and no site search' },
        ],
      },
      {
        blockType: 'security-points',
        heading: 'What we built',
        points: [
          { text: 'A fully custom-coded website — no template' },
          {
            text:
              'An admin panel with 11 content types and 2 staff roles, so staff update the site themselves',
          },
          { text: 'English, Japanese and Bengali, managed from one admin panel' },
          { text: 'An AI chatbot built into the site that answers visitors' },
          { text: 'Handoff to staff on WhatsApp' },
          { text: 'Search across every page that tolerates spelling variations' },
          { text: 'Contact forms with spam protection and automatic reply emails' },
          {
            text:
              'A live hosting environment with 7 connected services, plus system and operating documentation',
          },
        ],
      },
      {
        blockType: 'security-points',
        heading: 'What it means for Sadiatec',
        points: [
          { text: 'Staff can now publish news and update pages in three languages without a developer.' },
          {
            text:
              'Visitors get answers from the chatbot at any hour, and staff are reached on WhatsApp when needed.',
          },
        ],
      },
      {
        blockType: 'label-value-list',
        rows: [
          { label: 'Client comment', detail: '[Quote from Sadiatec, in their own words]' },
          {
            label: 'What came next',
            detail: 'The engine we built for Sadiatec became the foundation of AI受付 and our clinic demo.',
          },
          {
            label: 'Screenshots',
            detail:
              '[PLACEHOLDER: homepage, admin panel (private data hidden) and chatbot-open screenshots — pending Sadiatec’s written approval]',
          },
        ],
      },
      {
        blockType: 'cta-banner',
        heading: 'Want the same for your business?',
        primaryButton: { label: 'Get a free AI website assessment', href: '/assessment' },
      },
    ],
  }

  const jaData = {
    title: 'Sadiatec Co., Ltd.様：WordPressから、AIチャットを備えた多言語サイトへ',
    clientName: 'Sadiatec Co., Ltd.',
    industry: '人材・採用支援',
    tagline:
      'Sadiatec様は、人材・採用支援の企業です。約2か月でホームページを一から再構築し、3言語に対応、スタッフご自身で運用できる管理画面を備えました。',
    publishedAt: '2026-07-31T00:00:00.000Z',
    slug: 'sadiatec',
    active: true,
    visible: false,
    aiVisible: false,
    layout: [
      {
        blockType: 'page-hero',
        variant: 'hero',
        heading: 'Sadiatec Co., Ltd.様：WordPressから、AIチャットを備えた多言語サイトへ',
        body:
          'Sadiatec様は、人材・採用支援の企業です。約2か月でホームページを一から再構築し、3言語に対応、スタッフご自身で運用できる管理画面を備えました。',
        textAlignment: 'left',
      },
      {
        blockType: 'label-value-list',
        heading: '概要',
        rows: [
          { label: 'クライアント', detail: 'Sadiatec Co., Ltd.' },
          { label: '業種', detail: '人材・採用支援' },
          { label: '設立', detail: '2005年' },
          { label: '所在地', detail: '東京都千代田区' },
          { label: 'プロジェクト', detail: '多言語コーポレートサイトとコンテンツ管理基盤の新規構築' },
          { label: '構築期間', detail: '約2か月（2026年5月〜7月）' },
          { label: '規模', detail: '約20ページ・3言語・管理項目11種類・外部連携7件' },
        ],
      },
      {
        blockType: 'security-points',
        heading: '導入前',
        points: [
          { text: 'WordPressのホームページ' },
          { text: '内容の更新は、そのたび外部へ依頼' },
          { text: 'チャットブットもサイト内検索もなし' },
        ],
      },
      {
        blockType: 'security-points',
        heading: '構築したもの',
        points: [
          { text: 'テンプレートを使わない、完全な独自開発のサイト' },
          { text: '管理項目11種類・権限2種類の管理画面。スタッフご自身で更新できます' },
          { text: '英語・日本語・ベンガル語を、ひとつの管理画面で運用' },
          { text: 'サイトに組み込まれ、訪問者の質問に答えるAIチャットボット' },
          { text: 'WhatsAppでの担当者への引き継ぎ' },
          { text: '表記ゆれにも対応した、全ページ横断の検索' },
          { text: '迷惑送信対策と自動返信メールを備えたお問い合わせフォーム' },
          { text: '7つの外部サービスと連携した本番環境、およびシステム構成と運用手順のドキュメント' },
        ],
      },
      {
        blockType: 'security-points',
        heading: 'Sadiatec様にとっての意味',
        points: [
          {
            text:
              '3言語でのお知らせの掲載やページの更新を、制作会社に頼まずに行えるようになりました。',
          },
          {
            text:
              '訪問者はいつでもチャットボットから回答を得られ、必要なときはWhatsAppで担当者につながります。',
          },
        ],
      },
      {
        blockType: 'label-value-list',
        rows: [
          { label: 'お客様からのコメント', detail: '[Sadiatec様からのコメント（ご本人の言葉）]' },
          {
            label: 'その後',
            detail: 'Sadiatec様のために開発した基盤が、AI受付とクリニックのデモの土台になりました。',
          },
          {
            label: 'スクリーンショット',
            detail:
              '[プレースホルダー：ホームページ、管理画面（非公開データを非表示）、チャットボット表示画面 — Sadiatec様の書面での承認を待つ]',
          },
        ],
      },
      {
        blockType: 'cta-banner',
        heading: '同じ仕組みを、あなたのお店にも。',
        primaryButton: { label: '無料AIホームページ診断を申し込む', href: '/assessment' },
      },
    ],
  }

  await createLocalizedDoc(payload, 'case-studies', { en: enData, ja: jaData })

  payload.logger.info('📄 /case-studies/sadiatec content seeded, visible:false pending Sadiatec sign-off (Spec §13, F1-14)')
}
