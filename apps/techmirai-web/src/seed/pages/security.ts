import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Pack-3/I1: /security (Spec §9.2, lines 783-832 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Same
 * `updateLocalizedDoc` pattern as `pages/how-it-works.ts`. Every string below
 * is copied verbatim from the Spec; brackets preserved exactly per CLAUDE.md
 * rule 5.
 *
 * `security-points` reuses its existing optional `heading` field (already
 * loosened in the Pack-3/H2 engine fix) for "Accurate answers"/"Bookings" —
 * no engine change needed. Personal information / Support reuse the new
 * `label-value-list` block (see pages/pricing.ts's header comment for why
 * process-steps/setup-steps/integrations-status-table don't fit).
 *
 * TRUTH CHECK (required by the I1 step prompt — Spec: this page "states
 * only what the system actually does today"). Evidence gathered by reading
 * the actual implementation, not assumed from the Spec's confident wording:
 *   - No double bookings: TRUE. packages/cms-core/src/booking/api/reserve.ts
 *     claims slot capacity atomically in the booking engine; a lost race
 *     throws SlotUnavailableError, mapped to SLOT_FULL rather than allowing
 *     a second booking through.
 *   - Private manage link: TRUE. packages/cms-core/src/booking/api/tokens.ts
 *     derives the manage-link token via HMAC-SHA256, gives it a 30-day TTL
 *     distinct from the never-expiring access_token, and verifies it with
 *     timingSafeEqual.
 *   - Spam protection and request limits: PARTIAL. Contact forms use
 *     apps/techmirai-web/src/lib/rate-limit.ts, which upgrades to an Upstash
 *     Redis-backed limiter when configured. The booking API's own limiter
 *     (packages/cms-core/src/booking/api/rate-limit.ts) has no such
 *     fallback — its own doc comment flags it as process-local only, naming
 *     exactly the gap this step's own prompt warned about (multi-instance
 *     serverless scaling). Downgraded to [CONFIRM] below; logged as
 *     I1-06 in docs/PLACEHOLDER-REGISTER.md.
 *   - HTTPS: stated as-is — a hosting-platform-level guarantee, not
 *     something app code proves or disproves.
 *   - AI only from published content: TRUE.
 *     packages/cms-core/src/verticals/clinic/reception/ai/prompt.ts's
 *     buildSystemPrompt() instructs the model "Answer ONLY from the CLINIC
 *     CONTENT below," and corpus.ts filters every content source by the
 *     AI-visible flag before it ever reaches that prompt.
 *   - Automated-assistant label: TRUE.
 *     packages/cms-core/.../reception/ui/ReceptionPanel.tsx renders the
 *     "Automated assistant"/"自動応答" tag site-wide, citing Spec §16.1/§18.
 */
export async function seedSecurityPage(payload: Payload): Promise<void> {
  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'Safe for your customers. Supported for you.',
      body: 'Here is exactly how AI受付 keeps answers accurate, protects bookings and handles personal information.',
      textAlignment: 'left',
    },
    {
      blockType: 'security-points',
      heading: 'Accurate answers',
      points: [
        { text: 'Buttons and your approved answers handle most questions.' },
        { text: 'AI is used only when those find nothing, and only from content published on your website.' },
        {
          text: 'Availability, prices and appointment times always come from your booking data, never from AI.',
        },
        { text: 'AI受付 does not give medical, legal or financial advice.' },
        { text: 'Customers are told they are talking to an automated assistant.' },
        { text: 'You approve every answer before launch and can change it any time.' },
      ],
    },
    {
      blockType: 'security-points',
      heading: 'Bookings',
      points: [
        { text: 'Two customers can never book the same slot.' },
        { text: 'Customers manage their booking through a private link sent only to them.' },
        {
          text:
            'Forms have spam protection and request limits. [CONFIRM — the booking API\'s rate limiter runs per server process; confirm this holds at production scale before launch, or add a shared store.]',
        },
        { text: 'Every page is served over an encrypted connection (HTTPS).' },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'Personal information',
      rows: [
        {
          label: 'What we collect',
          detail: 'Name, phone, email, booking details and chat messages your customers send',
        },
        { label: 'Why', detail: 'To take and manage bookings and answer inquiries' },
        {
          label: 'Who can see it',
          detail: 'Your staff accounts, and TechMirai engineers when needed for support',
        },
        { label: 'Where it is stored', detail: '[Hosting provider and region — CONFIRM]' },
        {
          label: 'AI providers',
          detail:
            '[Provider names — CONFIRM, and check their data terms before stating anything about training]',
        },
        { label: 'How long', detail: '[Retention period — CONFIRM]' },
        {
          label: 'Rules',
          detail: "Our privacy policy and Japan's Act on the Protection of Personal Information",
        },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'Support',
      rows: [
        { label: 'Channels', detail: 'Email, phone and LINE' },
        { label: 'Language', detail: 'Japanese and English' },
        { label: 'Hours', detail: '[Weekdays 9:00–18:00 JST]' },
        { label: 'Reply time', detail: '[Within 1 business day]' },
        { label: 'Included monthly', detail: '[Monitoring], fixes, [N] content updates' },
        { label: 'If you leave', detail: 'We help you export your content and booking data' },
      ],
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'お客様に安心を。あなたには、確かなサポートを。',
      body: 'AI受付が回答の正確さを保ち、予約を守り、個人情報を取り扱うしくみを具体的にご説明します。',
      textAlignment: 'left',
    },
    {
      blockType: 'security-points',
      heading: '回答の正確さ',
      points: [
        { text: 'ほとんどのご質問は、ボタンと承認済みの回答で対応します。' },
        { text: 'AIを使うのは、それで見つからないときだけ。根拠はホームページに公開している内容に限ります。' },
        { text: '空き状況・料金・予約時間は、必ず予約データから表示し、AIが作ることはありません。' },
        { text: '医療・法律・お金に関する助言は行いません。' },
        { text: '自動応答であることを、お客様に必ずお知らせします。' },
        { text: '公開前にすべての回答をご確認いただき、いつでも変更できます。' },
      ],
    },
    {
      blockType: 'security-points',
      heading: '予約について',
      points: [
        { text: '同じ枠に2件の予約が入ることはありません。' },
        { text: 'お客様は、ご本人だけに届く専用のリンクから予約を管理できます。' },
        {
          text:
            'フォームには迷惑送信対策と送信回数の制限を設けています。[確認中 — 予約APIの送信制限はサーバープロセスごとに動作します。本番環境のスケールでも十分か、公開前に確認が必要です。]',
        },
        { text: 'すべてのページを暗号化通信（HTTPS）で配信しています。' },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: '個人情報について',
      rows: [
        { label: '収集する情報', detail: 'お名前、電話番号、メールアドレス、予約内容、チャットのメッセージ' },
        { label: '利用目的', detail: '予約の受付・管理と、お問い合わせへの対応のため' },
        {
          label: '閲覧できる人',
          detail: 'お客様のスタッフアカウント、およびサポートに必要な場合の当社エンジニア',
        },
        { label: '保存先', detail: '[保存先のサービスと地域 — 確認中]' },
        { label: '利用しているAIサービス', detail: '[利用しているAIサービス名 — 確認中]' },
        { label: '保存期間', detail: '[保存期間 — 確認中]' },
        { label: '適用されるルール', detail: 'プライバシーポリシーおよび個人情報保護法' },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'サポート',
      rows: [
        { label: '相談方法', detail: 'メール・電話・LINE' },
        { label: '対応言語', detail: '日本語・英語' },
        { label: '対応時間', detail: '[平日 9:00〜18:00]' },
        { label: '返信までの目安', detail: '[1営業日以内にご返信]' },
        { label: '月額に含まれるもの', detail: '[稼働の確認]、不具合の修正、月[N]回までの更新作業' },
        { label: '解約時', detail: 'コンテンツと予約データの書き出しをお手伝いします' },
      ],
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'security', { en: { layout: enLayout }, ja: { layout: jaLayout } })

  payload.logger.info('🔒 /security content seeded (Spec §9.2)')
}
