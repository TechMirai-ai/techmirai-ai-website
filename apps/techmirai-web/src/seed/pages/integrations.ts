import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Pack-3/H3: /integrations (Spec §8.2, lines 703-729 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Same
 * `updateLocalizedDoc` pattern as `pages/ai-reception.ts`. Every string
 * below is copied verbatim, including both CONFIRM brackets (External
 * calendars / Online shops and payments rows) — never resolved, per
 * CLAUDE.md rule 5. Registered as docs/PLACEHOLDER-REGISTER.md rows
 * H3-01/H3-02.
 *
 * No closing `cta-banner` (see how-it-works.ts's header comment for the
 * same judgment call) — the page ends on the table's own bottom line.
 */
export async function seedIntegrationsPage(payload: Payload): Promise<void> {
  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'Keep the tools you already use. We connect what can be connected.',
      body: 'There is no standard connection across Japanese booking software, so we check yours individually instead of promising everything.',
      textAlignment: 'left',
    },
    {
      blockType: 'integrations-status-table',
      rows: [
        { name: 'LINE Official Account', status: 'available', description: "Booking, confirmations, reminders, changes and cancellations inside LINE. Uses your own account; LINE's message fees may apply depending on your plan." },
        { name: 'Email', status: 'available', description: 'Confirmations to customers; notifications to staff.' },
        { name: 'Your domain', status: 'available', description: 'Your website stays on your own address.' },
        { name: 'Google Maps, Instagram and other profiles', status: 'available', description: 'Profile links lead straight to chat or booking.' },
        { name: 'WhatsApp', status: 'available', description: 'Hands conversations to your staff on WhatsApp; useful for international customers.' },
        { name: 'Your current booking system', status: 'case-by-case', description: 'Possible when it offers an API or data export. Otherwise staff are notified of each booking.' },
        // PLACEHOLDER-OFF: { name: 'External calendars', status: 'case-by-case', description: '[CONFIRM which calendars, if any]' },
        { name: 'Phone line', status: 'in-development', description: 'Part of AI受付 Voice.' },
        { name: 'Electronic medical records', status: 'not-offered', description: 'We do not connect to medical-record systems.' },
        { name: 'Online shops and payments', status: 'not-offered', description: 'AI受付 is a front desk, not an online shop.' }, // PLACEHOLDER-OFF: ' [CONFIRM online payment at booking]'
      ],
      footnote: 'Not sure about your tools? Send us the names in the free assessment form.',
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: '今お使いのツールは、そのままに。つなげられるものは、つなぎます。',
      body: '日本の予約システムには共通の連携方法がないため、何でもつながるとはお約束しません。お使いのシステムを一つずつ確認します。',
      textAlignment: 'left',
    },
    {
      blockType: 'integrations-status-table',
      rows: [
        { name: 'LINE公式アカウント', status: 'available', description: 'LINEの中で予約、確認通知、リマインド、変更・キャンセル。お客様ご自身のLINE公式アカウントを使用します。プランによってはLINEのメッセージ料金がかかります。' },
        { name: 'メール', status: 'available', description: 'お客様への確認メール、スタッフへの通知メール。' },
        { name: 'ご自身のドメイン', status: 'available', description: 'ご自身のドメインで運用します。' },
        { name: 'Googleマップ、Instagramなどのプロフィール', status: 'available', description: 'プロフィールのリンクから、チャットや予約へ直接ご案内します。' },
        { name: 'WhatsApp', status: 'available', description: 'WhatsAppでスタッフへ引き継ぎ。海外のお客様が多いお店に便利です。' },
        { name: '現在お使いの予約システム', status: 'case-by-case', description: 'API連携やデータ出力に対応していれば連携可能。対応していない場合は、予約ごとにスタッフへ通知します。' },
        // PLACEHOLDER-OFF: { name: '外部カレンダー', status: 'case-by-case', description: '[対応カレンダーを確認中]' },
        { name: '電話回線', status: 'in-development', description: 'AI受付（電話）で対応予定です。' },
        { name: '電子カルテ', status: 'not-offered', description: '電子カルテとの連携は行っていません。' },
        { name: 'ネットショップ・決済', status: 'not-offered', description: 'AI受付は受付の仕組みであり、ネットショップ機能はありません。' }, // PLACEHOLDER-OFF: '[予約時のオンライン決済は確認中]'
      ],
      footnote: 'お使いのツールがわからない場合も、無料診断のフォームにツール名をお書きください。',
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'integrations', {
    en: { layout: enLayout },
    ja: { layout: jaLayout },
  })

  payload.logger.info('🔌 /integrations content seeded (Spec §8.2)')
}
