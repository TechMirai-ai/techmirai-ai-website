import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Pack-3/I1: /pricing (Spec §9.1, lines 735-781 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Same
 * `updateLocalizedDoc` pattern as `pages/how-it-works.ts`. Every string below
 * is copied verbatim from the Spec; brackets preserved exactly per CLAUDE.md
 * rule 5.
 *
 * Included / Not included / Options reuse the new `label-value-list` block
 * (Pack-3/I1) rather than `process-steps`/`setup-steps` (both render
 * numbered step badges, wrong for a non-sequential list) or
 * `integrations-status-table` (forces a fixed 4-value status badge that
 * doesn't apply here).
 *
 * The Spec's §9.1 "Pricing FAQ" heading says "(also in Section 14: F17,
 * F18, F19)", but only F19's question (minimum contract) actually matches —
 * the other two rows given directly under that heading ("How do I pay?" /
 * "What if I stop the service?") have no id in the stable F01-F26 list.
 * Per the confirmed judgment call (I1 plan review), this renders §9.1's
 * own 3-row table as plain page content via `label-value-list`, not through
 * the relationship-based `faq` block — logged in docs/FINDINGS.md.
 *
 * The item-name column in the Spec's Included/Not included tables is given
 * in English only; the Options/Personal-information/Support tables' "Item"
 * column is likewise English-only. Short JA labels below are structural
 * row/column labels, not new facts — same precedent as `setup-steps`'
 * hardcoded NEED_LABEL ("What we need from you" / "ご準備いただくもの").
 * Where the Spec's own JA prose elsewhere already uses the exact short term
 * (e.g. "管理画面" from FAQ F16, "追加の言語"/"個別の連携" from this same
 * section's "What changes the price" JA line), that term is reused rather
 * than invented. The sole exception — "AI proof of concept" has no Spec JA
 * precedent anywhere — uses a plain structural label under the same
 * NEED_LABEL-style precedent, not a quoted Spec fact.
 *
 * No closing `cta-banner` — the package card's own button is the page's one
 * conversion action, same judgment call as `/how-it-works`.
 */
export async function seedPricingPage(payload: Payload): Promise<void> {
  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'Simple pricing. No surprises.',
      body: 'One starter package covers what most small businesses need. Your exact quote comes after the free assessment, with every cost listed.',
      textAlignment: 'left',
    },
    // PLACEHOLDER-OFF: pricing-teaser block (priceLine1/2 are required and bracketed).
    // {
    //   blockType: 'pricing-teaser',
    //   heading: 'Your plan',
    //   packageName: 'AI受付 Starter Package',
    //   priceLine1: 'Initial setup: From [¥300,000]',
    //   priceLine2: 'Monthly: From [¥30,000]',
    //   note: 'Your exact quote comes after the free assessment. [Wording from your accountant]',
    //   buttonLabel: 'Get a free AI website assessment',
    //   buttonHref: '/assessment',
    // },
    {
      blockType: 'label-value-list',
      heading: 'Included',
      rows: [
        // PLACEHOLDER-OFF: { label: 'Website', detail: 'Custom-built website, up to [N] pages, Japanese and English' },
        { label: 'Reception chat', detail: 'Chat with your approved answers, AI fallback and staff handoff' },
        {
          label: 'Booking',
          detail: 'Online booking, confirmations, reminders, customer changes and cancellations',
        },
        { label: 'LINE', detail: 'LINE booking and reminders on your LINE Official Account' },
        { label: 'Admin panel', detail: 'Staff update content and see bookings; separate staff permissions' },
        // PLACEHOLDER-OFF: row 'Monthly support' (bracketed, unconfirmed)
        // {
        //   label: 'Monthly support',
        //   detail: '[Hosting], fixes, [N] content updates per month, Japanese-language support',
        // },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'Not included',
      rows: [
        { label: 'LINE fees', detail: "LINE's own message fees, depending on your plan" },
        { label: 'Domain', detail: 'Domain registration and renewal' },
        // PLACEHOLDER-OFF: rows 'Photography and writing' / 'Other services' (bracketed, unconfirmed)
        // { label: 'Photography and writing', detail: 'Photo shoots; writing beyond [scope]' },
        // {
        //   label: 'Other services',
        //   detail: '[Any third-party service fees — CONFIRM what the monthly fee covers]',
        // },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'Options',
      rows: [
        // PLACEHOLDER-OFF: row 'Add AI受付 to your current website' (bracketed, unconfirmed)
        // {
        //   label: 'Add AI受付 to your current website',
        //   detail: '[Price — CONFIRM availability]',
        // },
        { label: 'AI受付 Voice', detail: 'In development; ask about a demo' },
        { label: 'More languages', detail: 'Quote on request' },
        { label: 'Custom integration', detail: 'Quote after checking your system' },
        { label: 'AI proof of concept', detail: 'Quote on request (see Technology)' },
      ],
      footnote:
        'What changes the price — number of pages, extra languages, custom integrations, and how much content we write for you.',
    },
    {
      blockType: 'label-value-list',
      heading: 'Common questions',
      rows: [
        // PLACEHOLDER-OFF: rows 'minimum contract period' / 'How do I pay?' (bracketed, unconfirmed)
        // { label: 'Is there a minimum contract period?', detail: '[CONFIRM]' },
        // { label: 'How do I pay?', detail: '[Bank transfer, monthly — CONFIRM]' },
        {
          label: 'What if I stop the service?',
          // PLACEHOLDER-OFF: ' [CONFIRM contract terms]' (suffix hidden)
          detail: 'You keep your content and customer data; we help you export it.',
        },
      ],
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'わかりやすく、明朗な料金。',
      body: '多くのお店に必要な機能を、ひとつのパッケージにまとめました。正式なお見積りは無料診断のあとに、すべての費用を明記してご提示します。',
      textAlignment: 'left',
    },
    // PLACEHOLDER-OFF: pricing-teaser block (priceLine1/2 are required and bracketed).
    // {
    //   blockType: 'pricing-teaser',
    //   heading: 'ご契約内容',
    //   packageName: 'AI受付 スタートパッケージ',
    //   priceLine1: '初期費用 [30万円]〜',
    //   priceLine2: '月額 [3万円]〜',
    //   note: '正式なお見積りは、無料診断のあとにご提示します。[税理士に確認した表記]',
    //   buttonLabel: '無料AIホームページ診断を申し込む',
    //   buttonHref: '/assessment',
    // },
    {
      blockType: 'label-value-list',
      heading: '含まれるもの',
      rows: [
        // PLACEHOLDER-OFF: { label: 'ホームページ', detail: '独自開発のホームページ（[N]ページまで、日本語・英語）' },
        {
          label: '受付チャット',
          detail: '承認済みの回答、AIによる補助、スタッフへの引き継ぎを備えた受付チャット',
        },
        {
          label: '予約',
          detail: 'オンライン予約、確認通知、リマインド、お客様による変更・キャンセル',
        },
        { label: 'LINE', detail: 'LINE公式アカウントでのLINE予約とリマインド' },
        { label: '管理画面', detail: 'スタッフによる内容の更新と予約の確認、権限の設定' },
        // PLACEHOLDER-OFF: row 月額サポート (bracketed, unconfirmed)
        // {
        //   label: '月額サポート',
        //   detail: '[サーバー管理]、不具合の修正、月[N]回までの更新作業、日本語でのサポート',
        // },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: '含まれないもの',
      rows: [
        { label: 'LINEのメッセージ料金', detail: 'プランに応じたLINEのメッセージ料金' },
        { label: 'ドメイン', detail: 'ドメインの取得・更新費用' },
        // PLACEHOLDER-OFF: rows 写真撮影・原稿作成 / 外部サービス (bracketed, unconfirmed)
        // { label: '写真撮影・原稿作成', detail: '写真撮影、[範囲]を超える原稿作成' },
        // {
        //   label: '外部サービス',
        //   detail: '[外部サービスの利用料 — 月額に含まれる範囲を確認中]',
        // },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'オプション',
      rows: [
        // PLACEHOLDER-OFF: row 今のホームページへのAI受付追加 (bracketed, unconfirmed)
        // {
        //   label: '今のホームページへのAI受付追加',
        //   detail: '[今のホームページへのAI受付追加 — 価格確認中]',
        // },
        { label: 'AI受付 Voice', detail: '開発中。デモはご相談ください' },
        { label: '追加の言語', detail: 'お見積り' },
        { label: '個別の連携', detail: 'システム確認後にお見積り' },
        { label: 'AIの実証実験（PoC）', detail: 'お見積り（技術・AI開発のページをご覧ください）' },
      ],
      footnote: 'ページ数、追加の言語、個別の連携、原稿作成の量によって変わります。',
    },
    {
      blockType: 'label-value-list',
      heading: 'よくあるご質問',
      rows: [
        // PLACEHOLDER-OFF: rows 最低契約期間 / 支払い方法 (bracketed, unconfirmed)
        // { label: '最低契約期間はありますか？', detail: '[確認中]' },
        // { label: '支払い方法は？', detail: '[銀行振込・毎月 — 確認中]' },
        {
          label: '解約したらどうなりますか？',
          // PLACEHOLDER-OFF: '[契約条件を確認中]' (suffix hidden)
          detail: 'コンテンツと顧客データはお客様のものです。データの書き出しをお手伝いします。',
        },
      ],
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'pricing', { en: { layout: enLayout }, ja: { layout: jaLayout } })

  payload.logger.info('💰 /pricing content seeded (Spec §9.1)')
}
