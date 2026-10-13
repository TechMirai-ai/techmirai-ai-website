// ─────────────────────────────────────────────────────────────────────────────
// TechMirai chat content — Content Spec §16.1–16.3 (pp. 87–96), K1.
//
// The single source of truth for the chat's text: the greeting, the six-button
// menu (B1–B6 plus sub-buttons), the 36 matched answers (F01–F26 from the FAQ,
// C01–C10 chat-only) with their match keywords, and the label of every "next
// button". techmirai-flow.ts builds the FlowGraph from this; the resolver reads
// the message tree `buildTechmiraiMessages` makes from it.
//
// English and Japanese are copied from the Spec as written. Facts the Spec
// shows in [brackets] stay in brackets. A Japanese label the Spec does not give
// is `[JA TODO]` (docs/PLACEHOLDER-REGISTER.md, K1-01) — never a translation.
// ─────────────────────────────────────────────────────────────────────────────

import type { Locale } from '@techmirai/reception-engine'

export interface Bilingual {
  en: string
  ja: string
}

/** Spec 16.1 widget title, identical in both languages. */
export const CHAT_WIDGET_TITLE = 'TechMirai AI受付'

/** Spec 16.1 greeting, input hint and always-visible link. */
export const CHAT_GREETING: Bilingual = {
  en: 'Hello! I’m TechMirai’s AI受付, an automated assistant. I can answer questions about our service, show you the demo, or book a free consultation. What would you like to do?',
  ja: 'こんにちは。TechMiraiのAI受付（自動応答）です。サービスについてのご質問、デモのご案内、無料相談のご予約を承ります。ご用件をお選びください。',
}
export const CHAT_INPUT_HINT: Bilingual = {
  en: 'Or type your question below.',
  ja: 'ご質問は、下の欄に入力することもできます。',
}
export const CHAT_TALK_TO_PERSON: Bilingual = { en: 'Talk to a person', ja: 'スタッフと話す' }

/** Node ids the host and the flow both need. */
export const START_NODE_ID = 'start'
export const MENU_NODE_ID = 'c01'
export const TALK_TO_PERSON_NODE_ID = 'b6'
export const BOOKING_NODE_ID = 'booking'
export const TRIAGE_NODE_ID = 'triage'
export const AI_NODE_ID = 'ai'
export const QUESTION_FIELD = 'question'

/**
 * Prefix of a link whose URL is per-client config the package cannot hold
 * (LINE, phone, demo site, brochure). The host swaps it for the real URL and
 * hides the button when there is none — see useReceptionEngine.
 */
export const HOST_LINK_PREFIX = '@'

/** Every button label that is not itself a menu entry. */
const JA_TODO = '[JA TODO]'
export const BUTTON_LABELS = {
  menu: { en: 'Menu', ja: 'メニュー' },
  howItWorks: { en: 'How it works', ja: '仕組み' },
  pricingPage: { en: 'Pricing page', ja: '料金ページ' },
  freeAssessment: { en: 'Free assessment', ja: '無料診断' },
  sendWebsite: { en: 'Send my website', ja: 'ホームページを送る' },
  bookCall: { en: 'Book a call', ja: '面談を予約' },
  voiceDemo: { en: 'Request a voice demo', ja: '電話受付のデモを依頼' },
  openDemo: { en: 'Open the demo', ja: 'デモを開く' },
  demo: { en: 'Demo', ja: 'デモ' },
  demoWalkthrough: { en: 'Book a demo walkthrough', ja: 'デモの案内を予約' },
  clinicPage: { en: 'Clinic page', ja: '活用例を見る' },
  line: { en: 'LINE', ja: 'LINE' },
  call: { en: 'Call', ja: '電話' },
  emailForm: { en: 'Email form', ja: 'メールフォーム' },
  contact: { en: 'Contact', ja: JA_TODO },
  contactPage: { en: 'Contact page', ja: JA_TODO },
  securityPage: { en: 'Security page', ja: JA_TODO },
  securitySupportPage: { en: 'Security & support page', ja: JA_TODO },
  privacyPolicy: { en: 'Privacy policy', ja: JA_TODO },
  integrationsPage: { en: 'Integrations page', ja: JA_TODO },
  aboutPage: { en: 'About page', ja: JA_TODO },
  beautyPage: { en: 'Beauty page', ja: JA_TODO },
  autoPage: { en: 'Automobile page', ja: JA_TODO },
  hotelPage: { en: 'Hotel page', ja: JA_TODO },
  brochure: { en: 'Download brochure (PDF)', ja: JA_TODO },
} as const satisfies Record<string, Bilingual>

export type ButtonLabelName = keyof typeof BUTTON_LABELS

export type NextButton =
  | { kind: 'node'; to: string }
  | { kind: 'link'; label: ButtonLabelName; href: string; newTab?: boolean }
  | { kind: 'booking'; label: ButtonLabelName }

export interface ChatKeywords {
  en: string[]
  ja: string[]
}

export interface ChatEntry {
  /** Flow node id, lower case (`b1`, `f17`, `c06`). */
  id: string
  /** The Spec's own code, for tests and the register (`B1`, `F17`, `C06`). */
  code: string
  /** Button label — present on the entries that are buttons. */
  label?: Bilingual
  answer: Bilingual
  next: NextButton[]
  keywords?: ChatKeywords
  /** The FAQ question the Spec pairs with this answer (F01–F26), also matched. */
  question?: Bilingual
  /** Scales the keyword score; a broad entry (F01) must lose to a specific one. */
  weight?: number
}

// ── builders ────────────────────────────────────────────────────────────────

const node = (to: string): NextButton => ({ kind: 'node', to })
const link = (label: ButtonLabelName, href: string, newTab = false): NextButton => ({
  kind: 'link',
  label,
  href,
  ...(newTab ? { newTab } : {}),
})
const booking = (label: ButtonLabelName): NextButton => ({ kind: 'booking', label })
const MENU = node(MENU_NODE_ID)

/** `'a, b; あ, い'` — the Spec's "EN; JA" keyword cell. */
function kw(cell: string): ChatKeywords {
  const [en = '', ja = ''] = cell.split(';')
  const split = (s: string) => s.split(',').map((k) => k.trim()).filter(Boolean)
  return { en: split(en), ja: split(ja) }
}

const HOW_IT_WORKS = link('howItWorks', '/how-it-works')
const PRICING = link('pricingPage', '/pricing')
const ASSESSMENT = link('freeAssessment', '/assessment')
const CONTACT = link('contact', '/contact')
const ABOUT = link('aboutPage', '/about')
const INTEGRATIONS = link('integrationsPage', '/integrations')
const OPEN_DEMO = link('openDemo', `${HOST_LINK_PREFIX}demo`, true)

// Spec 16.2 answers that other entries repeat ("Same as B1", …).
const B1_ANSWER: Bilingual = {
  en: 'AI受付 is a front desk for your website, chat and LINE. It answers common questions, takes reservations, sends reminders and hands customers to your staff when needed.',
  ja: 'AI受付は、ホームページ・チャット・LINEで働く受付の仕組みです。よくあるご質問に答え、予約を受け付け、リマインドを送り、必要なときはスタッフにおつなぎします。',
}
const B1A_ANSWER: Bilingual = {
  en: 'Most questions are answered by buttons and answers the business approved. AI is used only as a last step, from published content. Prices and availability always come from booking data, never AI.',
  ja: 'ほとんどのご質問は、ボタンとお店が承認した回答で対応します。AIは最後の手段として、公開中の情報だけをもとに使います。料金や空き状況は必ず予約データから表示し、AIが作ることはありません。',
}
const B1B_ANSWER: Bilingual = {
  en: 'AI受付 Web is available now. AI受付 Voice, for phone calls, is in development — we can show you a demo.',
  ja: 'AI受付（Web）は提供中です。電話に対応するAI受付（電話）は現在開発中で、デモをご覧いただけます。',
}
const B3_ANSWER: Bilingual = {
  en: 'The AI受付 Starter Package starts from [¥300,000] for setup and [¥30,000] per month. Your exact quote comes after a free assessment.',
  ja: 'AI受付 スタートパッケージは、初期費用[30万円]〜、月額[3万円]〜です。正式なお見積りは、無料診断のあとにご提示します。',
}

/** Spec 16.2 — the six-button menu, sub-buttons, and their answers. */
const MENU_ENTRIES: ChatEntry[] = [
  {
    id: 'b1',
    code: 'B1',
    label: { en: 'What is AI受付?', ja: 'AI受付とは？' },
    answer: B1_ANSWER,
    next: [node('b1a'), node('b1b'), MENU],
  },
  {
    id: 'b1a',
    code: 'B1a',
    label: { en: 'How accurate is it?', ja: '回答は正確？' },
    answer: B1A_ANSWER,
    next: [HOW_IT_WORKS, MENU],
  },
  {
    id: 'b1b',
    code: 'B1b',
    label: { en: 'Web and Voice', ja: 'Web版と電話版' },
    answer: B1B_ANSWER,
    next: [booking('voiceDemo'), MENU],
  },
  {
    id: 'b2',
    code: 'B2',
    label: { en: 'See the live demo', ja: 'デモを見る' },
    answer: {
      en: 'Our live demo is a working clinic website. Ask its chat a question, book a real appointment, then cancel it yourself. The clinic is fictional.',
      ja: 'デモは、実際に動くクリニックのホームページです。チャットへの質問、実際の予約、ご自身でのキャンセルまでお試しいただけます。医院は架空のものです。',
    },
    next: [OPEN_DEMO, booking('demoWalkthrough'), MENU],
  },
  {
    id: 'b3',
    code: 'B3',
    label: { en: 'Pricing', ja: '料金について' },
    answer: B3_ANSWER,
    next: [PRICING, ASSESSMENT, MENU],
  },
  {
    id: 'b4',
    code: 'B4',
    label: { en: 'Examples by industry', ja: '業種別の活用例' },
    answer: { en: 'Which business are you in?', ja: 'どちらの業種でしょうか？' },
    next: [node('b4-clinic'), node('b4-beauty'), node('b4-auto'), node('b4-hotel'), node('b4-other')],
  },
  {
    id: 'b4-clinic',
    code: 'B4-clinic',
    label: { en: 'Clinic', ja: 'クリニック・治療院' },
    answer: {
      en: 'AI受付 answers questions about hours, access and first visits, takes bookings, and sends reminders. It never gives medical advice; symptom questions go to staff.',
      ja: '診療時間・アクセス・初診についてのご質問への回答、予約の受付、リマインドを行います。医療的な助言は行わず、症状のご質問はスタッフにおつなぎします。',
    },
    next: [link('clinicPage', '/solutions/clinic'), link('demo', `${HOST_LINK_PREFIX}demo`, true), MENU],
  },
  {
    id: 'b4-beauty',
    code: 'B4-beauty',
    label: { en: 'Beauty', ja: '美容サロン' },
    answer: {
      en: 'AI受付 answers menu questions, takes LINE bookings and sends reminders while your hands are busy.',
      ja: '施術中でも、メニューのご質問への回答、LINE予約、リマインドをAI受付が行います。',
    },
    next: [link('beautyPage', '/solutions/beauty'), MENU],
  },
  {
    id: 'b4-auto',
    code: 'B4-auto',
    label: { en: 'Auto', ja: '自動車' },
    answer: {
      en: 'AI受付 takes inspection and maintenance bookings, answers common questions and passes estimate requests to staff.',
      ja: '車検・点検のご予約、よくあるご質問への回答、見積もり依頼のスタッフへの引き継ぎを行います。',
    },
    next: [link('autoPage', '/solutions/automobile'), MENU],
  },
  {
    id: 'b4-hotel',
    code: 'B4-hotel',
    label: { en: 'Hotel', ja: 'ホテル・宿泊' },
    answer: {
      en: 'AI受付 answers guests’ questions in Japanese and English, at any hour. Room bookings stay with your current booking system.',
      ja: 'ゲストのご質問に、日本語・英語で24時間お答えします。客室のご予約は、現在の予約システムをそのままお使いいただけます。',
    },
    next: [link('hotelPage', '/solutions/hotel'), MENU],
  },
  {
    id: 'b4-other',
    code: 'B4-other',
    label: { en: 'Other', ja: 'その他' },
    answer: {
      en: 'Any business that takes bookings and answers repeat questions can use AI受付. Tell us about yours in a free assessment.',
      ja: '予約を受け付け、同じ質問に答えているお店であれば、業種を問わずご利用いただけます。無料診断でお聞かせください。',
    },
    next: [ASSESSMENT, MENU],
  },
  {
    id: 'b5',
    code: 'B5',
    label: { en: 'Free assessment or consultation', ja: '無料診断・相談' },
    answer: {
      en: 'Choose what suits you: send your website for a written report, or book a 30-minute online call.',
      ja: 'ご希望の方法をお選びください。ホームページを送ってレポートを受け取るか、30分のオンライン面談をご予約いただけます。',
    },
    next: [link('sendWebsite', '/assessment'), booking('bookCall'), MENU],
  },
  {
    id: 'b6',
    code: 'B6',
    label: { en: 'Talk to a person', ja: 'スタッフと話す' },
    answer: {
      en: 'Of course. Our team replies [on weekdays 9:00–18:00]. How would you like to reach us?',
      ja: 'かしこまりました。スタッフは[平日 9:00〜18:00]に対応しています。ご希望の連絡方法をお選びください。',
    },
    next: [
      link('line', `${HOST_LINK_PREFIX}line`, true),
      link('call', `${HOST_LINK_PREFIX}tel`),
      link('emailForm', '/contact'),
    ],
  },
]

/** Spec 16.3 F01–F26 (F25 per decision D-5: the in-person sentence is omitted). */
const FAQ_ENTRIES: ChatEntry[] = [
  {
    id: 'f01', code: 'F01', weight: 0.4,
    question: { en: 'What is AI受付?', ja: 'AI受付とは何ですか？' },
    keywords: kw('what is, about, explain, product; とは, 何, サービス内容, 説明'),
    answer: B1_ANSWER,
    next: [node('b1a'), node('b1b')],
  },
  {
    id: 'f02', code: 'F02',
    question: { en: 'How is it different from an ordinary chatbot?', ja: '一般的なチャットボットとの違いは？' },
    keywords: kw('chatbot, difference, compare; チャットボット, 違い'),
    answer: {
      en: 'It answers in layers — buttons, approved answers, then AI — with a person at every step, and it takes and changes bookings, not just replies.',
      ja: 'ボタン、承認済みの回答、AIの順に段階的に答え、どの段階でもスタッフにつながります。返信だけでなく、予約の受付や変更まで行います。',
    },
    next: [HOW_IT_WORKS],
  },
  {
    id: 'f03', code: 'F03',
    question: { en: 'Do I need a new website?', ja: '新しいホームページが必要ですか？' },
    keywords: kw('new website, existing site, current website, add; 新しいホームページ, 今のサイト, 既存, 追加'),
    answer: {
      en: 'Not necessarily. We can build a new site with AI受付 built in, or [add it to your current website]. The free assessment shows which fits.',
      ja: '必ずしも必要ではありません。AI受付を組み込んだ新しいサイトをつくるか、[今のサイトに追加する]ことができます。どちらが合うかは無料診断でご案内します。',
    },
    next: [ASSESSMENT],
  },
  {
    // Industry nouns (salon, 美容室, …) show up in questions about everything else
    // ("connect to my salon's booking site"), so they must not outscore F14's "connect".
    id: 'f04', code: 'F04', weight: 0.5,
    question: { en: 'Which businesses is it for?', ja: 'どんなお店に向いていますか？' },
    keywords: kw('industry, business type, salon, clinic, hotel; 業種, 向いている, 美容室, 整骨院, ホテル'),
    answer: {
      en: 'Businesses that take bookings and answer the same questions every day, such as clinics, salons, auto shops, hotels, restaurants and real estate offices.',
      ja: '予約を受け付け、毎日同じ質問に答えているお店です。クリニック・治療院、美容サロン、自動車整備、ホテル、飲食店、不動産会社などです。',
    },
    next: [node('b4')],
  },
  {
    id: 'f05', code: 'F05',
    question: { en: 'Which languages does it support?', ja: '対応言語は？' },
    keywords: kw('language, English, Chinese, Korean, multilingual; 言語, 英語, 中国語, 韓国語, 多言語'),
    answer: {
      en: 'Japanese and English as standard. Other languages can be added on request.',
      ja: '日本語と英語に標準対応しています。その他の言語もご相談ください。',
    },
    next: [CONTACT],
  },
  {
    id: 'f06', code: 'F06',
    question: { en: 'Is there a phone version?', ja: '電話に対応する版はありますか？' },
    keywords: kw('phone, voice, call, telephone; 電話, 音声, 通話'),
    answer: B1B_ANSWER,
    next: [booking('voiceDemo')],
  },
  {
    id: 'f07', code: 'F07',
    question: { en: 'Will the AI give wrong answers?', ja: 'AIが間違った回答をすることはありませんか？' },
    keywords: kw('wrong, mistake, accurate, hallucination, trust; 間違い, 正確, 信頼, ハルシネーション'),
    answer: B1A_ANSWER,
    next: [HOW_IT_WORKS],
  },
  {
    id: 'f08', code: 'F08',
    question: { en: 'Do customers know they are talking to AI?', ja: 'お客様は、AIと話していることがわかりますか？' },
    keywords: kw('are you human, real person, bot, AI; 人間, 本物, ロボット, AIですか'),
    answer: {
      en: 'I’m an automated assistant. You can reach a person any time with “Talk to a person”.',
      ja: '私は自動応答のアシスタントです。「スタッフと話す」から、いつでもスタッフにつながります。',
    },
    next: [node('b6')],
  },
  {
    id: 'f09', code: 'F09',
    question: { en: 'Does AI受付 give medical or legal advice?', ja: '医療や法律の相談にも答えますか？' },
    keywords: kw('medical, symptoms, legal, lawyer, advice; 医療, 症状, 法律, 弁護士, 相談'),
    answer: {
      en: 'No. AI受付 does not give medical or legal advice; those questions go to the business’s staff.',
      ja: 'いいえ。AI受付は医療や法律の助言を行わず、そうしたご質問はお店のスタッフにおつなぎします。',
    },
    next: [MENU],
  },
  {
    id: 'f10', code: 'F10',
    question: { en: 'What happens when AI受付 cannot answer?', ja: 'AI受付が答えられないときは？' },
    keywords: kw('don’t know, no answer, cannot; わからない, 答えられない'),
    answer: {
      en: 'When AI受付 can’t answer, it says so and offers a way to reach staff by LINE, phone or form.',
      ja: '答えられない場合は、その旨をお伝えし、LINE・電話・フォームなどスタッフへの連絡方法をご案内します。',
    },
    next: [MENU],
  },
  {
    id: 'f11', code: 'F11',
    question: { en: 'How is customer data protected?', ja: 'お客様のデータはどう守られていますか？' },
    keywords: kw('data, privacy, security, personal information, safe; データ, 個人情報, セキュリティ, 安全'),
    answer: {
      en: 'Bookings are protected against double booking, forms have spam protection, and personal information is handled under our privacy policy and Japanese law.',
      ja: '予約の重複防止やフォームの迷惑送信対策を備え、個人情報はプライバシーポリシーと日本の法令に基づいて取り扱います。',
    },
    next: [link('securityPage', '/security'), link('privacyPolicy', '/privacy')],
  },
  {
    id: 'f12', code: 'F12',
    question: { en: 'How long does setup take?', ja: '導入までの期間は？' },
    keywords: kw('how long, setup time, weeks, schedule, launch; 期間, どのくらい, 何週間, 導入までの'),
    answer: {
      en: 'Typically [X weeks] after we receive your content. We give you a schedule after the assessment.',
      ja: '資料をお預かりしてから、目安は[X週間]です。無料診断のあとに具体的なスケジュールをご提示します。',
    },
    next: [ASSESSMENT],
  },
  {
    id: 'f13', code: 'F13',
    question: { en: 'What do you need from us?', ja: '何を用意すればよいですか？' },
    keywords: kw('prepare, need from us, materials; 用意, 準備, 必要なもの'),
    answer: {
      en: 'Your business details, hours, services and prices, common questions and photos. No question list yet? We draft one with you.',
      ja: 'お店の基本情報、営業時間、サービス内容と料金、よくあるご質問、写真です。質問がまとまっていなくても、一緒に作成します。',
    },
    next: [HOW_IT_WORKS],
  },
  {
    id: 'f14', code: 'F14',
    question: { en: 'Can it connect to our current booking system?', ja: '今使っている予約システムとつながりますか？' },
    keywords: kw('integrate, connect, booking system, API, existing system; 連携, つなぐ, 予約システム, 既存'),
    answer: {
      en: 'Case by case. If your system offers an API or data export we can usually connect it; if not, AI受付’s booking can take over or staff are notified of each booking.',
      ja: 'システムによって異なります。API連携やデータ出力に対応していれば多くの場合つなげられ、対応していない場合はAI受付の予約機能に切り替えるか、予約ごとにスタッフへ通知します。',
    },
    next: [INTEGRATIONS, ASSESSMENT],
  },
  {
    id: 'f15', code: 'F15',
    question: { en: 'Do we need a LINE Official Account?', ja: 'LINE公式アカウントは必要ですか？' },
    keywords: kw('LINE, official account, LINE fees; LINE公式アカウント, LINE料金'),
    answer: {
      en: 'For LINE booking you need a LINE Official Account; we can help set one up. LINE’s message fees may apply depending on your plan.',
      ja: 'LINEでの予約にはLINE公式アカウントが必要で、開設もお手伝いします。プランによってはLINEのメッセージ料金がかかります。',
    },
    next: [INTEGRATIONS],
  },
  {
    id: 'f16', code: 'F16',
    question: { en: 'Can our staff update the answers themselves?', ja: '回答の内容は、スタッフが自分で変更できますか？' },
    keywords: kw('edit, update, change answers, admin; 更新, 変更, 管理画面, 編集'),
    answer: {
      en: 'Yes. Answers, hours, services and prices are edited in the admin panel, with no coding.',
      ja: 'はい。回答・営業時間・サービス・料金は、プログラミングなしで管理画面から変更できます。',
    },
    next: [MENU],
  },
  {
    id: 'f17', code: 'F17',
    question: { en: 'How much does it cost?', ja: '料金はいくらですか？' },
    keywords: kw('price, cost, how much, fee, monthly, setup; 料金, 値段, 費用, いくら, 月額, 初期費用'),
    answer: B3_ANSWER,
    next: [PRICING, ASSESSMENT],
  },
  {
    id: 'f18', code: 'F18',
    question: { en: 'Are there other costs?', ja: 'ほかに費用はかかりますか？' },
    keywords: kw('extra cost, hidden fees, other costs; 追加料金, ほかの費用'),
    answer: {
      en: 'Possibly LINE message fees, domain fees and [other third-party fees]. Every cost is listed in your quote.',
      ja: 'LINEのメッセージ料金、ドメイン費用、[その他の外部サービス料金]がかかる場合があります。お見積りにすべて明記します。',
    },
    next: [PRICING],
  },
  {
    id: 'f19', code: 'F19',
    question: { en: 'Is there a minimum contract period?', ja: '最低契約期間はありますか？' },
    keywords: kw('contract, minimum, cancel contract; 契約期間, 最低, 解約'),
    answer: { en: '[CONFIRM]', ja: '[確認中]' },
    next: [CONTACT],
  },
  {
    id: 'f20', code: 'F20',
    question: { en: 'Can we use a government IT subsidy?', ja: '国のIT関連の補助金は使えますか？' },
    keywords: kw('subsidy, grant, government support; 補助金, 助成金, IT導入補助金'),
    answer: {
      en: 'Not through us at the moment: TechMirai is not currently a registered support provider for Japan’s IT subsidy programme.',
      ja: '現時点では、当社は補助金制度の登録支援事業者ではないため、当社のサービスでのご利用はできません。',
    },
    next: [CONTACT],
  },
  {
    id: 'f21', code: 'F21',
    question: { en: 'What support is included?', ja: 'どんなサポートがありますか？' },
    keywords: kw('support, maintenance, help after launch; サポート, 保守, 公開後'),
    answer: {
      en: 'Monthly support covers [monitoring], fixes, [N] content updates per month and help by email, phone and LINE.',
      ja: '月額サポートには、[稼働の確認]、不具合の修正、月[N]回までの更新作業、メール・電話・LINEでのご相談が含まれます。',
    },
    next: [link('securitySupportPage', '/security')],
  },
  {
    id: 'f22', code: 'F22',
    question: { en: 'Can we talk to you in Japanese?', ja: '日本語で相談できますか？' },
    keywords: kw('Japanese, speak Japanese; 日本語, 日本語で相談'),
    answer: {
      en: 'Yes. Consultations, quotes and support are all available in Japanese.',
      ja: 'はい。ご相談、お見積り、サポートまで、すべて日本語で対応します。',
    },
    next: [node('b6')],
  },
  {
    id: 'f23', code: 'F23',
    question: { en: 'Who is TechMirai?', ja: 'TechMiraiはどんな会社ですか？' },
    keywords: kw('company, who are you, team, founder; 会社, どんな会社, チーム, 代表'),
    answer: {
      en: 'A small Japan-based team building AI reception for small businesses, founded by Jamal Shah, with Sadiatec Co., Ltd. (est. 2005) as our partner.',
      ja: '中小企業・店舗のためのAI受付をつくる、日本を拠点とした少人数のチームです。代表はジャマル・シャー、パートナーは2005年設立のSadiatec Co., Ltd.です。',
    },
    next: [ABOUT],
  },
  {
    id: 'f24', code: 'F24',
    question: { en: 'Where is development done?', ja: '開発はどこで行っていますか？' },
    keywords: kw('where developed, offshore, overseas, Bangladesh; 開発場所, 海外, バングラデシュ'),
    answer: {
      en: '[Planning, management and client contact are in Japan; some team members work remotely from overseas — CONFIRM.]',
      ja: '[企画・管理・お客様対応は日本で行い、一部のメンバーは海外からリモートで開発しています — 確認中]',
    },
    next: [ABOUT],
  },
  {
    id: 'f25', code: 'F25',
    question: { en: 'Do you only work in the Tokyo area?', ja: '東京近郊だけの対応ですか？' },
    keywords: kw('area, Tokyo, visit, in person, nationwide; エリア, 東京, 訪問, 全国'),
    // D-5 (FINDINGS 2026-10-13): the Spec's second sentence is an in-person claim
    // the business has not confirmed; omitted, registered as K1-02.
    answer: {
      en: 'Online consultations anywhere in Japan.',
      ja: 'オンラインでのご相談は全国で承ります。',
    },
    next: [node('b5')],
  },
  {
    id: 'f26', code: 'F26',
    question: { en: 'Is the demo clinic real?', ja: 'デモのクリニックは実在しますか？' },
    keywords: kw('real clinic, fictional, sakura; 実在, 架空, さくら'),
    answer: {
      en: 'No, it is fictional. The booking and chat are real, so you can try every step.',
      ja: 'いいえ、架空の医院です。予約やチャットは実際に動くため、すべての流れをお試しいただけます。',
    },
    next: [OPEN_DEMO],
  },
]

/** Spec 16.3 C01–C10. C01 doubles as the main-menu node ("Main menu"). */
const CHAT_ONLY_ENTRIES: ChatEntry[] = [
  {
    id: 'c01', code: 'C01',
    keywords: kw('hello, hi; こんにちは, はじめまして'),
    answer: { en: 'Hello! How can I help?', ja: 'こんにちは。ご用件をお選びください。' },
    next: [], // the six menu buttons — filled by the flow
  },
  {
    id: 'c02', code: 'C02',
    keywords: kw('thanks, thank you; ありがとう'),
    answer: {
      en: 'You’re welcome. Is there anything else I can help with?',
      ja: 'どういたしまして。ほかにお手伝いできることはありますか？',
    },
    next: [MENU],
  },
  {
    id: 'c03', code: 'C03',
    keywords: kw('phone number, email, contact; 電話番号, メール, 連絡先'),
    answer: {
      en: 'Phone [080-7701-3004], email info@techmirai-ai.com, or LINE. Our team replies [on weekdays 9:00–18:00].',
      ja: '電話[080-7701-3004]、メール info@techmirai-ai.com、またはLINEでご連絡ください。スタッフは[平日 9:00〜18:00]に対応しています。',
    },
    next: [node('b6')],
  },
  {
    id: 'c04', code: 'C04',
    keywords: kw('where, address, office, location; 場所, 住所, 事務所, どこ'),
    answer: {
      en: '[Published address]. Online consultations are available anywhere in Japan.',
      ja: '[掲載住所]です。オンラインでのご相談は全国で承ります。',
    },
    next: [ABOUT],
  },
  {
    id: 'c05', code: 'C05',
    keywords: kw('brochure, PDF, materials, document; 資料, パンフレット, PDF'),
    answer: { en: 'You can download our brochure here.', ja: 'こちらから資料をダウンロードいただけます。' },
    next: [link('brochure', `${HOST_LINK_PREFIX}brochure`, true)],
  },
  {
    id: 'c06', code: 'C06',
    keywords: kw('discount, cheaper, negotiate, campaign; 値引き, 安く, 割引, キャンペーン'),
    answer: {
      en: 'Quotes are prepared after the free assessment, based on what you need. Our team will discuss the details with you.',
      ja: 'お見積りは、無料診断のあとにご要望に合わせて作成します。詳細はスタッフがご相談に応じます。',
    },
    next: [ASSESSMENT, node('b6')],
  },
  {
    id: 'c07', code: 'C07',
    keywords: kw('competitor, other company, compare with; 他社, 比較, 競合'),
    answer: {
      en: 'I can’t comment on other companies, but I’m happy to explain how AI受付 works.',
      ja: '他社についてはお答えできませんが、AI受付のしくみはご説明できます。',
    },
    next: [HOW_IT_WORKS],
  },
  {
    id: 'c08', code: 'C08',
    keywords: kw('complaint, angry, problem, not working; 苦情, クレーム, 困っている, 動かない'),
    answer: {
      en: 'I’m sorry for the trouble. Let me connect you with our staff right away.',
      ja: 'ご迷惑をおかけして申し訳ございません。すぐにスタッフにおつなぎします。',
    },
    next: [node('b6')],
  },
  {
    id: 'c09', code: 'C09',
    keywords: kw('train, training data, use my data; 学習, 学習データ, データ利用'),
    answer: {
      en: '[CONFIRM after checking AI provider terms]. Until then: Please see our privacy policy, or ask our staff for details.',
      ja: '[AIサービスの規約確認後に記載]。それまでは：プライバシーポリシーをご覧いただくか、スタッフにお問い合わせください。',
    },
    next: [link('privacyPolicy', '/privacy'), node('b6')],
  },
  {
    id: 'c10', code: 'C10',
    keywords: kw('job, hiring, career, partner, agency; 採用, 求人, パートナー, 代理店'),
    answer: {
      en: 'Thank you for your interest. Please contact us through the contact form and our team will reply.',
      ja: 'ご関心をお寄せいただきありがとうございます。お問い合わせフォームからご連絡ください。スタッフよりご返信します。',
    },
    next: [link('contactPage', '/contact')],
  },
]

/**
 * Spec 16.5 "AI doesn't know" — the interim text for the AI-fallback node until
 * K2 wires the hand-off rules. Spec wording, no invention.
 */
export const AI_UNKNOWN_ANSWER: Bilingual = {
  en: 'I’m not sure about that. Our staff can answer — would you like to contact them?',
  ja: '申し訳ございません、その内容はわかりかねます。スタッフがお答えできますので、ご連絡されますか？',
}

export const MENU_BUTTON_IDS = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'] as const

/** F01–F26 and C01–C10: the 36 answers a typed question can land on. */
export const MATCHED_ENTRIES: readonly ChatEntry[] = [...FAQ_ENTRIES, ...CHAT_ONLY_ENTRIES]

/** Every answer node in the flow: the menu entries and the 36 matched ones. */
export const ALL_ENTRIES: readonly ChatEntry[] = [...MENU_ENTRIES, ...MATCHED_ENTRIES]

const ENTRY_BY_ID = new Map(ALL_ENTRIES.map((e) => [e.id, e]))

export function getEntry(id: string): ChatEntry | undefined {
  return ENTRY_BY_ID.get(id)
}

// ── message tree for the resolver ───────────────────────────────────────────

type Tree = { [key: string]: string | Tree }

/**
 * The `reception` subtree for one locale: `tm.<id>.{label,answer}`, `tm.btn.<name>`,
 * plus the greeting, input hint and the interim AI answers. Merged over the
 * package's i18n JSON by the hook, so site.config's greeting override still wins.
 */
export function buildTechmiraiMessages(locale: Locale): Tree {
  const tm: Tree = {}
  for (const entry of ALL_ENTRIES) {
    const node: Tree = { answer: entry.answer[locale] }
    if (entry.label) node['label'] = entry.label[locale]
    tm[entry.id] = node
  }
  const btn: Tree = {}
  for (const [name, label] of Object.entries(BUTTON_LABELS)) btn[name] = label[locale]
  tm['btn'] = btn
  tm['greeting'] = CHAT_GREETING[locale]
  tm['inputHint'] = CHAT_INPUT_HINT[locale]
  tm['talkToPerson'] = CHAT_TALK_TO_PERSON[locale]
  return {
    greeting: CHAT_GREETING[locale],
    tm,
    faq: { ai: { answer: AI_UNKNOWN_ANSWER[locale], offTopic: AI_UNKNOWN_ANSWER[locale] } },
  }
}
