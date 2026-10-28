import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'
import siteConfig from '../../../site.config'
import type { DownloadIds } from '../downloads'

/**
 * Pack-3/H1: /ai-reception (Spec §6, lines 468-534 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). First
 * non-home per-page seed file — same `updateLocalizedDoc` pattern as
 * `pages/home.ts`. Every string below is copied verbatim; brackets
 * preserved exactly per CLAUDE.md rule 5.
 *
 * 6.5 ("How answers stay accurate") is seeded via `product-edition` with
 * only heading/body/button populated, not `rich-text` — the Spec's "H2 +
 * body + link" shape is simple and typed fields already express it exactly;
 * hand-authoring Lexical's heading/link node JSON for one small section
 * would be needless risk for a block already being used twice on this page.
 *
 * 6.6's "·"-joined business-type list is split into discrete
 * `security-points` array items — the field expects one list entry per
 * point, not a single joined string (unlike `itemsList`-shaped fields
 * elsewhere, which match the Spec's own single-cell formatting).
 *
 * The final CTA repeats homepage 5.14's `cta-banner` content verbatim — the
 * Spec explicitly says "End with the final call to action block from
 * 5.14," i.e. this is a shared closing CTA reused by design, not
 * page-specific copy.
 */
export async function seedAiReceptionPage(payload: Payload, downloads: DownloadIds): Promise<void> {
  const demoUrl = siteConfig.integrations.demoUrl

  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      eyebrow: 'TechMirai AI受付',
      heading: 'Answers. Books. Hands over to your staff. On every channel.',
      body: 'Your website should do more than show information. TechMirai turns small-business websites into customer service desks that answer questions, guide customers, accept reservations, connect with LINE and social media, and hand important inquiries to your staff.',
      primaryButton: { label: 'Get a free AI website assessment', href: '/assessment' },
      secondaryButton: { label: 'Try the live demo', href: demoUrl },
      textAlignment: 'left',
    },
    {
      blockType: 'process-steps',
      // Spec §6.2 gives no H2 for this section (unlike every other section
      // on this page) — left empty rather than inventing one; `heading` is
      // optional on this block as of this step.
      steps: [
        { title: 'Answer questions.', line: 'Hours, services, access and first-visit information, from your approved answers.' },
        { title: 'Help customers choose.', line: 'Simple questions guide each customer to the right service.' },
        { title: 'Accept reservations.', line: 'Real-time availability, confirmation by email or LINE, no double bookings.' },
        { title: 'Connect with LINE.', line: 'Booking, reminders, changes and cancellations inside the app customers already use.' },
        { title: 'Guide customers from social media.', line: 'Instagram and Google Maps links lead straight into chat or booking.' },
        { title: 'Support multiple languages.', line: 'Japanese and English as standard; more on request.' },
        { title: 'Hand important inquiries to staff.', line: 'Every screen shows a way to reach a person.' },
      ],
    },
    {
      blockType: 'product-edition',
      heading: 'AI受付 Web: your website as a front desk',
      badge: 'Available now',
      body: 'A custom-built website with reception chat, online booking and LINE built in. Your staff update everything from one admin panel.',
      itemsList:
        'Website engine · Online reservation · LINE booking · LINE reminders · Change and cancel by customers · Reception chat · Handoff to staff · Japanese and English content · Admin panel · Staff notification for every booking',
      waysToStart: [
        { text: 'New website with AI受付 built in' },
        // PLACEHOLDER-OFF: { text: '[Add AI受付 to your current website] — CONFIRM availability' },
      ],
    },
    {
      blockType: 'product-edition',
      heading: 'AI受付 Voice: a receptionist that answers the phone',
      badge: 'In development · Demo available',
      body: "An AI receptionist that answers calls in Japanese and English, designed to use the same approved answers as your website and LINE. When it cannot help, it takes the caller's name and number so your staff can call back.",
      itemsList: 'Phone-line connection · Live speech input · Customer-insight dashboard',
      closingLine: 'Interested? Ask for a demo.',
      buttonLabel: 'Request a voice demo',
      buttonHref: '/booking',
    },
    {
      blockType: 'product-edition',
      heading: 'Not every question needs AI.',
      body: 'AI受付 answers in layers: buttons first, then your approved answers, then AI based on your published content — and a person at every step.',
      buttonLabel: 'How it works',
      buttonHref: '/how-it-works',
    },
    {
      blockType: 'security-points',
      heading: 'Made for businesses that take bookings and answer the same questions every day.',
      points: [
        { text: 'Clinics and treatment rooms' },
        { text: 'Beauty salons' },
        { text: 'Auto service and dealers' },
        { text: 'Hotels and guesthouses' },
        { text: 'Restaurants' },
        { text: 'Real estate offices' },
      ],
    },
    {
      blockType: 'cta-banner',
      heading: 'Transform your website into an AI reception desk.',
      body: 'Send us your website address. We will show you what AI受付 could handle for your business — and what your staff should keep. Free, in Japanese or English.',
      primaryButton: { label: 'Get a free AI website assessment', href: '/assessment' },
      secondaryButton: { label: 'Ask us on LINE', href: '#', variant: 'outline' },
      textLink: { label: 'Download the brochure (PDF)', href: downloads.brochureUrl },
      showContactStrip: true,
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      eyebrow: 'TechMirai AI受付',
      heading: '答える。予約する。スタッフにつなぐ。すべての窓口で。',
      body: 'ホームページは、情報を見せるだけの場所ではありません。TechMiraiは、中小企業・店舗のホームページを、質問に答え、お客様をご案内し、予約を受け付け、LINEやSNSとつながり、大切なお問い合わせはスタッフに引き継ぐ「お客様対応の窓口」に変えます。',
      primaryButton: { label: '無料AIホームページ診断を申し込む', href: '/assessment' },
      secondaryButton: { label: 'デモを体験する', href: demoUrl },
      textAlignment: 'left',
    },
    {
      blockType: 'process-steps',
      steps: [
        { title: '質問に答える。', line: '営業時間、サービス内容、アクセス、はじめての方へのご案内などに、承認済みの回答で対応します。' },
        { title: 'サービス選びをお手伝い。', line: 'いくつかの簡単な質問で、お客様に合ったサービスへご案内します。' },
        { title: '予約を受け付ける。', line: '空き状況をリアルタイムで表示し、メールまたはLINEで確認通知。予約の重複は起きません。' },
        { title: 'LINEとつながる。', line: '予約、リマインド、変更・キャンセルを、お客様がいつも使っているアプリの中で。' },
        { title: 'SNSからご案内。', line: 'InstagramやGoogleマップのリンクから、チャットや予約へ直接つながります。' },
        { title: '多言語に対応。', line: '日本語・英語に標準対応。その他の言語もご相談ください。' },
        { title: '大切なお問い合わせはスタッフへ。', line: 'どの画面にも、スタッフへの連絡手段を表示します。' },
      ],
    },
    {
      blockType: 'product-edition',
      heading: 'AI受付（Web）：ホームページを、受付に。',
      badge: '提供中',
      body: '受付チャット、オンライン予約、LINE連携を組み込んだ、独自開発のホームページです。内容はすべて、ひとつの管理画面からスタッフが更新できます。',
      itemsList:
        '独自のサイト基盤・オンライン予約・LINE予約・LINEリマインド・お客様による変更とキャンセル・受付チャット・スタッフへの引き継ぎ・日本語と英語のコンテンツ・管理画面・予約ごとのスタッフ通知',
      waysToStart: [
        { text: 'AI受付を組み込んだ、新しいホームページ' },
        // PLACEHOLDER-OFF: { text: '[今のホームページにAI受付を追加] — 提供可否を確認中' },
      ],
    },
    {
      blockType: 'product-edition',
      heading: 'AI受付（電話）：電話に応対するAI受付',
      badge: '開発中・デモあり',
      body: '日本語・英語で電話に応対するAI受付です。ホームページやLINEと同じ承認済みの回答を使えるよう設計しています。対応できない内容は、お名前と電話番号をお預かりし、スタッフから折り返しご連絡します。',
      itemsList: '電話回線との接続・音声入力のリアルタイム処理・お問い合わせ傾向のダッシュボード',
      closingLine: 'ご興味のある方は、デモをご覧ください。',
      buttonLabel: '電話受付のデモを依頼する',
      buttonHref: '/booking',
    },
    {
      blockType: 'product-edition',
      heading: 'すべての質問に、AIが必要なわけではありません。',
      body: 'AI受付は段階的に答えます。まずボタン、次に承認済みの回答、それでも見つからないときだけ公開中の情報にもとづくAI。そして、どの段階でもスタッフにつながります。',
      buttonLabel: '仕組みを詳しく見る',
      buttonHref: '/how-it-works',
    },
    {
      blockType: 'security-points',
      heading: '毎日予約を受け、同じ質問に答えているお店のために。',
      points: [
        { text: 'クリニック・治療院' },
        { text: '美容サロン' },
        { text: '自動車整備・販売' },
        { text: 'ホテル・宿泊施設' },
        { text: '飲食店' },
        { text: '不動産会社' },
      ],
    },
    {
      blockType: 'cta-banner',
      heading: 'あなたのホームページを、AI受付に。',
      body: 'ホームページのURLをお送りください。AI受付で対応できること、そしてスタッフが担うべきことを、無料でお伝えします。日本語・英語どちらでもご相談いただけます。',
      primaryButton: { label: '無料AIホームページ診断を申し込む', href: '/assessment' },
      secondaryButton: { label: 'LINEで相談する', href: '#', variant: 'outline' },
      textLink: { label: '資料をダウンロード（PDF）', href: downloads.brochureUrl },
      showContactStrip: true,
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'ai-reception', {
    en: { layout: enLayout },
    ja: { layout: jaLayout },
  })

  payload.logger.info('📱 /ai-reception content seeded (Spec §6)')
}
