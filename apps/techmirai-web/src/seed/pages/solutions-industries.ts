import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'
import siteConfig from '../../../site.config'
import type { DownloadIds } from '../downloads'

type Industry = 'clinic' | 'beauty' | 'automobile' | 'hotel'
type Bi = { en: string; ja: string }

interface IndustryContent {
  slug: Industry
  h1: Bi
  sub: Bi
  problems: Bi[]
  whatItDoes: Bi[]
  staffHandles: Bi[]
  customerLabel: Bi
  chat: { speaker: 'customer' | 'ai'; message: Bi }[]
  demoButton?: Bi
  smallPrint?: Bi
}

// Spec §7.1-7.4, copied verbatim; brackets preserved exactly per CLAUDE.md
// rule 5. `customerLabel` ("Patient"/"Customer"/"Guest") has no separate JA
// translation cell in the Spec's Speaker table (that column holds the
// message, not a label) — the JA values below are not invented
// translations: they are words already used verbatim in each industry's
// own Spec body text above (Clinic: "患者さん"; Beauty/Automobile:
// "お客様"; Hotel: "ゲスト" — all appear in the "What it does"/"Problems"
// rows quoted alongside).
const INDUSTRIES: IndustryContent[] = [
  {
    slug: 'clinic',
    h1: { en: 'Why not let AI handle just the reception?', ja: '受付だけ、AIに任せませんか。' },
    sub: {
      en: 'Calls during treatment, the same questions about hours and parking, booking changes — AI受付 takes care of them, so your staff can focus on patients.',
      ja: '施術中の電話、診療時間や駐車場についての同じ質問、予約の変更。AI受付がまとめて対応し、スタッフは患者さんに集中できます。',
    },
    problems: [
      { en: 'The phone rings in the middle of treatment', ja: '施術の途中で電話が鳴る' },
      { en: 'Hours, parking, insurance and first-visit questions every day', ja: '診療時間、駐車場、保険、初診についての質問が毎日くる' },
      { en: 'Changes and cancellations by phone', ja: '変更やキャンセルの電話' },
      { en: 'Patients who do not speak Japanese', ja: '日本語が話せない患者さんへの対応' },
    ],
    whatItDoes: [
      {
        en: 'Answers hours, access, parking, what to bring and first-visit steps from your approved answers',
        ja: '診療時間、アクセス、駐車場、持ち物、初診の流れに承認済みの回答で対応',
      },
      { en: 'Online booking with first visit or return visit', ja: '初診／再診を選べるオンライン予約' },
      { en: 'Confirmation and reminder by LINE or email', ja: 'LINEまたはメールで確認通知とリマインド' },
      { en: 'Patients change or cancel themselves; staff are notified', ja: '患者さんご自身で変更・キャンセル、スタッフには通知' },
      { en: 'English for foreign patients', ja: '外国人の患者さんには英語で対応' },
      { en: 'Never gives medical advice: symptom questions go to staff', ja: '医療的な助言は行わず、症状のご質問はスタッフへ' },
    ],
    staffHandles: [
      { en: 'Symptoms and treatment advice', ja: '症状や施術についてのご相談' },
      { en: 'Insurance questions outside the standard answers', ja: '標準の回答以外の保険のご質問' },
      { en: 'Complaints', ja: 'ご意見やご不満' },
      { en: 'Emergencies', ja: '緊急時の対応' },
    ],
    customerLabel: { en: 'Patient', ja: '患者さん' },
    chat: [
      { speaker: 'customer', message: { en: 'Are you open on Saturday afternoon?', ja: '土曜日の午後は診療していますか？' } },
      {
        speaker: 'ai',
        message: {
          en: 'On Saturdays we are open [9:00–13:00]; the afternoon is closed. Would you like to book a Saturday morning visit? [Book] [Hours] [Talk to staff]',
          ja: '土曜日は[9:00〜13:00]の診療で、午後は休診です。土曜日の午前でご予約されますか？［予約する］［診療時間］［スタッフと話す］',
        },
      },
      { speaker: 'customer', message: { en: 'My lower back has hurt for a week. What should I do?', ja: '一週間前から腰が痛いのですが、どうしたらいいですか？' } },
      {
        speaker: 'ai',
        message: {
          en: 'I’m sorry to hear that. I can’t judge symptoms — our staff will. You can book a first visit or contact staff. In an emergency, please call 119. [Book a first visit] [Contact staff]',
          ja: 'おつらいですね。症状についての判断は、スタッフがいたします。初診のご予約、またはスタッフへのご連絡をお選びください。緊急の場合は119番にお電話ください。［初診を予約する］［スタッフに連絡］',
        },
      },
    ],
    demoButton: { en: 'Open the live clinic demo', ja: 'クリニックのデモを開く' },
    smallPrint: {
      en: '[Demo clinic name] is a fictional clinic created for this demo.',
      ja: 'デモに登場する[医院名]は、デモ用の架空の医院です。',
    },
  },
  {
    slug: 'beauty',
    h1: { en: 'Bookings keep coming in, even while your hands are busy.', ja: '施術中でも、予約はちゃんと入ってくる。' },
    sub: {
      en: 'AI受付 answers menu questions, takes LINE bookings and sends reminders, so you can stay with the customer in your chair.',
      ja: 'メニューのご質問への回答、LINEでのご予約、リマインドの送信まで。AI受付にまかせて、目の前のお客様に集中できます。',
    },
    problems: [
      { en: 'You can’t answer the phone mid-treatment', ja: '施術中は電話に出られない' },
      { en: 'Instagram and LINE messages pile up', ja: 'InstagramやLINEのメッセージがたまる' },
      { en: 'The same questions about menu, time and parking', ja: 'メニュー、所要時間、駐車場についての同じ質問' },
      { en: 'Last-minute changes', ja: '直前の予約変更' },
    ],
    whatItDoes: [
      {
        en: 'Answers menu, duration and access questions from your approved menu; prices shown straight from your menu data',
        ja: 'メニュー、所要時間、アクセスのご質問に承認済みの内容で回答。料金はメニューのデータをそのまま表示',
      },
      { en: 'LINE booking and reminders', ja: 'LINE予約とリマインド' },
      // PLACEHOLDER-OFF: { en: '[Choose a staff member — CONFIRM]', ja: '[スタッフ指名 — 確認中]' },
      { en: 'Customers change or cancel themselves', ja: 'お客様ご自身で変更・キャンセル' },
      { en: 'Your Instagram profile link opens chat or booking', ja: 'Instagramのプロフィールからチャットや予約へ' },
      { en: 'English for visitors', ja: '観光客の方には英語で対応' },
    ],
    staffHandles: [
      { en: 'Hair and skin consultations', ja: '髪や肌の状態についてのご相談' },
      { en: 'Allergies and sensitivities', ja: 'アレルギーなど体質に関わること' },
      { en: 'Complaints', ja: 'ご意見やご不満' },
      { en: 'Special requests', ja: '特別なご要望' },
    ],
    customerLabel: { en: 'Customer', ja: 'お客様' },
    chat: [
      { speaker: 'customer', message: { en: 'How long does a cut and colour take?', ja: 'カットとカラーで、どのくらい時間がかかりますか？' } },
      {
        speaker: 'ai',
        message: {
          en: 'A cut and colour takes about [2 hours]. Would you like to see available times? [See times] [Menu & prices] [Talk to staff]',
          ja: 'カット＋カラーは[約2時間]です。空いている日時をご覧になりますか？［空き日時を見る］［メニューと料金］［スタッフと話す］',
        },
      },
    ],
  },
  {
    slug: 'automobile',
    h1: { en: 'Inspection and service bookings, without the phone tag.', ja: '車検・点検のご予約を、電話のやりとりなしで。' },
    sub: {
      en: 'Your mechanics stay in the workshop. AI受付 answers common questions and takes bookings for inspections and maintenance, day and night.',
      ja: '整備士は作業に集中したまま。よくあるご質問への回答と、車検・点検・整備のご予約を、昼も夜もAI受付が承ります。',
    },
    problems: [
      { en: 'Nobody can answer the phone from the workshop', ja: '作業中は電話に出られない' },
      { en: 'Questions about inspection timing, documents and hours', ja: '車検の時期、必要書類、営業時間についての質問' },
      { en: 'Estimate requests missing key details', ja: '見積もり依頼に必要な情報が足りない' },
      { en: 'Questions from foreign residents', ja: '外国人のお客様からのご質問' },
    ],
    whatItDoes: [
      { en: 'Answers inspection, maintenance, hours and access questions from approved answers', ja: '車検、点検、営業時間、アクセスのご質問に承認済みの回答で対応' },
      { en: 'Books 車検 (vehicle inspection), 点検 (check-up) and other services in real-time slots', ja: '車検・点検などのご予約をリアルタイムで受付' },
      { en: 'Reminder before each appointment', ja: 'ご予約前のリマインド' },
      { en: 'Collects estimate requests with car details and passes them to staff', ja: '車の情報とあわせて見積もり依頼を受け付け、スタッフへ引き継ぎ' },
      { en: 'English for foreign residents', ja: '外国人のお客様には英語で対応' },
      { en: 'Staff notified of every booking', ja: '予約ごとにスタッフへ通知' },
    ],
    staffHandles: [
      { en: 'Diagnosis', ja: '故障の診断' },
      { en: 'Repair estimates and prices', ja: '修理の見積もりと金額' },
      { en: 'Insurance and accident claims', ja: '保険や事故の対応' },
      { en: 'Complaints', ja: 'ご意見やご不満' },
    ],
    customerLabel: { en: 'Customer', ja: 'お客様' },
    chat: [
      { speaker: 'customer', message: { en: 'What do I need to bring for my inspection?', ja: '車検のとき、何を持っていけばいいですか？' } },
      {
        speaker: 'ai',
        message: {
          en: 'Please bring [your vehicle inspection certificate, compulsory insurance certificate and …]. Would you like to book? [Book an inspection] [Request an estimate] [Talk to staff]',
          ja: '[車検証、自賠責保険証明書、…]をお持ちください。ご予約されますか？［車検を予約する］［見積もりを依頼する］［スタッフと話す］',
        },
      },
    ],
  },
  {
    slug: 'hotel',
    h1: { en: 'Answer every guest question, in English, at any hour.', ja: 'ゲストのご質問に、英語でも、何時でも。' },
    sub: {
      en: 'Check-in times, luggage, parking, breakfast and directions — AI受付 answers in Japanese and English, so your front desk can focus on the guests in the lobby.',
      ja: 'チェックイン時間、荷物の預かり、駐車場、朝食、道案内。AI受付が日本語・英語でお答えし、フロントはロビーのお客様に集中できます。',
    },
    problems: [
      { en: 'The front desk is busiest at check-in', ja: 'チェックインの時間帯はフロントが最も忙しい' },
      { en: 'The same questions from every guest', ja: 'どのお客様からも同じ質問' },
      { en: 'Messages at night', ja: '夜間のメッセージ' },
      { en: 'Guests from abroad', ja: '海外からのお客様' },
    ],
    whatItDoes: [
      { en: 'Answers guest questions in Japanese and English, 24 hours', ja: '日本語・英語で24時間、ゲストのご質問に回答' },
      { en: 'Pre-arrival information', ja: 'ご到着前のご案内' },
      { en: 'Bookings for on-site services such as [meals, rentals]', ja: '[お食事、レンタル]など館内サービスのご予約' },
      { en: 'Links guests to your current room-booking page', ja: '客室のご予約は現在の予約ページへご案内' },
      { en: 'Handoff to the front desk by phone, LINE or WhatsApp', ja: '電話、LINE、WhatsAppでフロントへ引き継ぎ' },
      { en: 'Staff notified of every booking', ja: '予約ごとにスタッフへ通知' },
    ],
    staffHandles: [
      { en: 'Payments', ja: 'お支払い' },
      { en: 'Room changes', ja: 'お部屋の変更' },
      { en: 'Complaints', ja: 'ご意見やご不満' },
      { en: 'Special requests', ja: '特別なご要望' },
      { en: 'Emergencies', ja: '緊急時の対応' },
    ],
    customerLabel: { en: 'Guest', ja: 'ゲスト' },
    chat: [
      { speaker: 'customer', message: { en: 'Can I leave my luggage before check-in?', ja: 'チェックイン前に荷物を預けられますか？' } },
      {
        speaker: 'ai',
        message: {
          en: 'Yes. The front desk can keep your luggage from [time]. Check-in starts at [15:00]. [Access] [Facilities] [Contact the front desk]',
          ja: 'はい、[時間]からフロントでお預かりできます。チェックインは[15:00]からです。［アクセス］［館内設備］［フロントに連絡］',
        },
      },
    ],
  },
]

/**
 * Pack-3/H2's "one industry-page template," realized as one shared
 * builder function called 4 times with different content — matching the
 * seed-side convention `ai-reception.ts` already established (raw
 * `{ blockType, ...fields }` arrays), rather than a hardcoded React
 * template. Fixed block sequence per Spec §7: hero → four problems → what
 * AI受付 does → example chat → what staff still handle → three FAQs → the
 * closing CTA (reusing 5.14 verbatim, same precedent as ai-reception.ts —
 * Section 7 gives no page-specific CTA copy of its own, unlike Section 6).
 */
function buildIndustryLayout(
  content: IndustryContent,
  demoUrl: string,
  downloads: DownloadIds,
  faqIds: (string | number)[],
) {
  const heroButtonEn = content.demoButton ? { primaryButton: { label: content.demoButton.en, href: demoUrl } } : {}
  const heroButtonJa = content.demoButton ? { primaryButton: { label: content.demoButton.ja, href: demoUrl } } : {}
  const smallPrintEn = content.smallPrint ? { smallPrint: content.smallPrint.en } : {}
  const smallPrintJa = content.smallPrint ? { smallPrint: content.smallPrint.ja } : {}

  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: content.h1.en,
      body: content.sub.en,
      textAlignment: 'left',
      ...heroButtonEn,
      ...smallPrintEn,
    },
    { blockType: 'problem-section', cards: content.problems.map((p) => ({ text: p.en })) },
    { blockType: 'security-points', points: content.whatItDoes.map((p) => ({ text: p.en })) },
    {
      blockType: 'example-chat',
      customerLabel: content.customerLabel.en,
      turns: content.chat.map((t) => ({ speaker: t.speaker, message: t.message.en })),
    },
    { blockType: 'security-points', points: content.staffHandles.map((p) => ({ text: p.en })) },
    { blockType: 'faq', sectionHeading: 'Frequently asked questions', variant: 'accordion', items: faqIds },
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
      heading: content.h1.ja,
      body: content.sub.ja,
      textAlignment: 'left',
      ...heroButtonJa,
      ...smallPrintJa,
    },
    { blockType: 'problem-section', cards: content.problems.map((p) => ({ text: p.ja })) },
    { blockType: 'security-points', points: content.whatItDoes.map((p) => ({ text: p.ja })) },
    {
      blockType: 'example-chat',
      customerLabel: content.customerLabel.ja,
      turns: content.chat.map((t) => ({ speaker: t.speaker, message: t.message.ja })),
    },
    { blockType: 'security-points', points: content.staffHandles.map((p) => ({ text: p.ja })) },
    { blockType: 'faq', sectionHeading: 'よくあるご質問', variant: 'accordion', items: faqIds },
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

  return { enLayout, jaLayout }
}

export async function seedSolutionsIndustryPages(
  payload: Payload,
  downloads: DownloadIds,
  industryFaqIds: Record<Industry, (string | number)[]>,
): Promise<void> {
  const demoUrl = siteConfig.integrations.demoUrl ?? ''

  for (const content of INDUSTRIES) {
    const { enLayout, jaLayout } = buildIndustryLayout(content, demoUrl, downloads, industryFaqIds[content.slug])
    await updateLocalizedDoc(payload, 'pages', content.slug, {
      en: { layout: enLayout },
      ja: { layout: jaLayout },
    })
  }

  payload.logger.info(`🏭 4 industry pages seeded (Spec §7.1-7.4: ${INDUSTRIES.map((i) => i.slug).join(', ')})`)
}
