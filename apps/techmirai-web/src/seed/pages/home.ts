import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'
import siteConfig from '../../../site.config'
import type { MediaIds } from '../media'

/**
 * Pack-3/G1: Homepage Hero, Problem section, Before/After table (Spec
 * §5.1-5.3). Writes real `layout` content into the `home` pages-collection
 * doc that Pack-2/F3 seeded empty. Uses `updateLocalizedDoc` (not
 * `upsertBySlug`, which no-ops once the doc exists) — see the G1 plan's
 * "seed approach" decision. Every string below is copied verbatim from
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md` lines
 * 243-304; brackets preserved exactly per CLAUDE.md rule 5.
 */
export async function seedHomePage(payload: Payload, media: MediaIds): Promise<void> {
  const demoUrl = siteConfig.integrations.demoUrl

  const enLayout = [
    {
      blockType: 'hero',
      eyebrow: 'AI reception for small businesses in Japan',
      headline: 'Turn your website into a 24/7 AI reception desk.',
      subheadline:
        "Every customer gets an answer — even at 10pm, even in English. AI受付 answers questions, takes reservations and connects with LINE, so your staff step in only when it matters.",
      channelChips: 'Website · Chat · LINE · Reservations',
      trustLine: 'Japanese-language support · Free · No pushy follow-up',
      chatPointer: 'The chat in the corner is our own AI受付. Ask it anything.',
      heroSlides: [
        {
          image: media.heroPhoneMockup,
          alt: 'AI受付 answering a question and confirming a booking on a smartphone',
        },
      ],
      reservationButton: { label: 'Get a free AI website assessment', href: '/assessment' },
      secondaryButton: { label: 'Try the live demo', href: demoUrl },
      hoursCard: {
        title: 'Who answers, and when',
        aiRow: 'AI受付: every day, 24 hours',
        staffLabel: 'Our staff:',
        note: 'Outside staff hours, AI受付 answers and takes bookings. Staff follow up the next business day.',
      },
      // linkLabel/linkHref explicitly empty: the field's defaultValue is a
      // hardcoded English string left from the clinic template. Spec §5.1's
      // "New here?" card is a note, not a link — omitting the keys entirely
      // would let Payload silently fill that English default on both
      // locales (a real Gate 4 violation caught during G1 verification).
      firstVisitCard: {
        heading: 'New here?',
        description:
          'Haruka Fujimori, our client relations lead, handles first consultations in Japanese and English. No preparation needed — just tell us about your business.',
        linkLabel: '',
        linkHref: '',
      },
      showScrollIndicator: true,
    },
    {
      blockType: 'problem-section',
      heading: 'Is your website only providing information?',
      intro:
        'Many small-business websites still work like digital brochures. Customers find you, and then they still have to:',
      journeySteps: [
        { text: 'Visit the website' },
        { text: 'Search for information' },
        { text: 'Call the business' },
        { text: 'Wait for opening hours' },
        { text: 'Go to another booking site' },
        { text: 'Fill in another form' },
      ],
      journeyCaption: 'Every extra step is a chance to lose a customer.',
      cards: [
        { text: 'The phone rings while you are with a customer.' },
        { text: 'The same five questions, answered again and again.' },
        { text: 'The 10pm inquiry nobody sees until morning.' },
        { text: 'Changes and cancellations still handled by phone.' },
        { text: 'Foreign customers you cannot serve properly.' },
        { text: 'Website, LINE, phone, booking sheet — four places to check.' },
      ],
      navyBandText:
        'What if the first reply happened on its own — and your staff only stepped in when it actually mattered?',
      closingLine:
        'Your website should not stop at providing information. It should help customers take the next step.',
    },
    {
      blockType: 'before-after',
      heading: 'Static website vs. AI-powered website',
      sub: 'Same business. A very different experience for your customers and your staff.',
      beforeLabel: 'Before',
      afterLabel: 'After',
      rows: [
        { area: 'Questions', before: 'Customer searches pages or calls', after: 'Answered in chat, at any hour' },
        {
          area: 'Reservations',
          before: 'Phone during opening hours, or a separate booking site',
          after: 'Booked on your website or in LINE, 24/7',
        },
        {
          area: 'Changes and cancellations',
          before: 'By phone',
          after: 'Customers do it themselves; staff are notified',
        },
        {
          area: 'Reminders',
          before: 'None, or staff call one by one',
          after: 'Automatic reminder by LINE or email',
        },
        { area: 'After hours', before: 'Inquiries wait until morning', after: 'The first reply happens on its own' },
        {
          area: 'Foreign customers',
          before: 'Japanese only',
          after: 'Japanese and English as standard',
        },
        {
          area: 'Updating the site',
          before: 'Ask a developer',
          after: 'Your staff update it in the admin panel',
        },
        {
          area: 'Staff time',
          before: 'The same questions all day',
          after: 'Staff focus on the customers in front of them',
        },
      ],
    },
  ]

  const jaLayout = [
    {
      blockType: 'hero',
      eyebrow: '中小企業・店舗のためのAI受付',
      headline: 'ホームページを、24時間働くAI受付に。',
      subheadline:
        '夜10時でも、英語でも。お客様の質問に答え、予約を受け付け、LINEともつながります。スタッフが対応するのは、本当に必要なときだけです。',
      channelChips: 'ホームページ・チャット・LINE・予約',
      trustLine: '日本語でご相談いただけます・無料・しつこい営業はいたしません',
      chatPointer: '右下のチャットも、私たちのAI受付です。お気軽に話しかけてください。',
      heroSlides: [
        {
          image: media.heroPhoneMockup,
          alt: 'スマートフォンでAI受付が質問に答え、予約を確定している画面',
        },
      ],
      reservationButton: { label: '無料AIホームページ診断を申し込む', href: '/assessment' },
      secondaryButton: { label: 'デモを体験する', href: demoUrl },
      hoursCard: {
        title: 'いつ、誰が対応するか',
        aiRow: 'AI受付：毎日・24時間',
        staffLabel: 'スタッフ：',
        note: 'スタッフの営業時間外も、AI受付が質問への回答と予約の受付を行い、翌営業日にスタッフからご連絡します。',
      },
      firstVisitCard: {
        heading: 'はじめての方へ',
        description:
          'はじめてのご相談は、お客様窓口の藤森が日本語・英語で承ります。事前のご準備は不要です。お店のことをお気軽にお聞かせください。',
        linkLabel: '',
        linkHref: '',
      },
      showScrollIndicator: true,
    },
    {
      blockType: 'problem-section',
      heading: 'そのホームページ、情報を載せているだけになっていませんか？',
      intro:
        '多くのお店のホームページは、まだ「デジタルのパンフレット」のままです。お客様はホームページを見つけたあとも、こんな手間をかけています。',
      journeySteps: [
        { text: 'ホームページを見る' },
        { text: '情報を探す' },
        { text: '電話をかける' },
        { text: '営業時間を待つ' },
        { text: '別の予約サイトへ移動' },
        { text: 'もう一度入力する' },
      ],
      journeyCaption: '手間がひとつ増えるたびに、お客様が離れてしまうかもしれません。',
      cards: [
        { text: '接客中に、電話が鳴る。' },
        { text: '同じ質問に、何度も答えている。' },
        { text: '夜10時の問い合わせに、翌朝まで気づけない。' },
        { text: '予約の変更・キャンセルは、いまも電話で対応している。' },
        { text: '外国人のお客様に、十分な対応ができていない。' },
        { text: 'ホームページ、LINE、電話、予約表。確認する場所が4つもある。' },
      ],
      navyBandText: 'もし、最初の返信が自動で届き、スタッフは本当に必要なときだけ対応すればよいとしたら？',
      closingLine:
        'ホームページの役割は、情報を伝えることだけではありません。お客様が次の一歩を踏み出せるよう、手助けすることです。',
    },
    {
      blockType: 'before-after',
      heading: 'これまでのホームページと、AI受付つきのホームページ',
      sub: '同じお店でも、お客様とスタッフの体験は大きく変わります。',
      beforeLabel: 'これまで',
      afterLabel: 'AI受付つき',
      rows: [
        { area: '質問', before: 'ページを探すか、電話をかける', after: 'チャットで、いつでもすぐに回答' },
        {
          area: '予約',
          before: '営業時間内の電話、または別の予約サイト',
          after: 'ホームページやLINEから、24時間予約',
        },
        {
          area: '変更・キャンセル',
          before: '電話で対応',
          after: 'お客様ご自身で変更・キャンセル。スタッフには通知',
        },
        {
          area: 'リマインド',
          before: 'なし、またはスタッフが個別に連絡',
          after: 'LINEまたはメールで自動リマインド',
        },
        { area: '営業時間外', before: '翌朝まで対応できない', after: '最初の返信は自動で' },
        { area: '外国人対応', before: '日本語のみ', after: '日本語・英語に標準対応' },
        { area: '更新作業', before: '制作会社に依頼', after: '管理画面からスタッフが更新' },
        { area: 'スタッフの時間', before: '一日中、同じ質問に対応', after: '目の前のお客様に集中' },
      ],
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'home', {
    en: { layout: enLayout },
    ja: { layout: jaLayout },
  })

  payload.logger.info('🏠 Homepage Hero/Problem/Before-After content seeded (Spec §5.1-5.3)')
}
