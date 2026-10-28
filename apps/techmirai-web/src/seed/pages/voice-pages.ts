import { JA_TODO } from './voice-home'

/**
 * Voice-pivot inner pages (ECC Master Prompt v2 §8-§9): /demo, /partners,
 * /company. English is complete; Japanese is derived by `toJa`, which keeps
 * the structure and replaces every visible string with [JA TODO] unless the
 * prompt itself supplied the Japanese (JA_EXACT, copied exactly — CLAUDE.md
 * rule 6). Unconfirmed facts stay [TBD: ...] and are listed in
 * docs/PLACEHOLDER-REGISTER.md (V1-*).
 */

// English → Japanese. The first block is Japanese supplied verbatim by the
// prompt. Everything below it is DRAFT Japanese written at the owner's request
// (2026-10-21) and MUST be reviewed by a native speaker before launch
// (prompt: "Japanese copy marked DRAFT must be reviewed"; register V1-01).
const JA_EXACT: Readonly<Record<string, string>> = {
  'Try the voice demo': '音声デモを体験する',
  'Consult about partnership': '協業について相談する',
  'Consult about adopting the AI voice agent': 'AI音声エージェントの導入を相談する',
  Validate: '検証',
  'Measure the effect': '効果測定',
  'Decide on adoption': '導入判断',
  'Production development': '本番開発',

  // ── section pills and headings added in the screenshot restyle
  'Live demo': 'ライブデモ',
  Partnership: '協業',
  'PoC scope': 'PoCの範囲',
  'What a typical PoC covers': '一般的なPoCで扱う内容',
  Evaluation: '評価',
  'About us': '会社について',

  // ── page titles
  Demo: 'デモ',
  Partners: 'パートナー',
  Company: '会社情報',

  // ── shared
  // PLACEHOLDER-OFF:
  // 'Last updated: [TBD: owner to confirm date] · Responsible company: [TBD: legal company name]':
  //   '最終更新日：[TBD：オーナー確認待ち]・責任主体：[TBD：正式な会社名]',

  // ── /demo
  'Voice demo': '音声デモ',
  'This page shows how an AI voice agent handles a call: the conversation, the transcript and the summary your team sees the next morning. It is for call-center operators and businesses that want to see the AI voice agent before a conversation. Everything here is a scripted simulation with a fictional business; next, you can consult us about partnership or adoption.':
    'このページでは、AI音声エージェントが電話にどう対応するかを、会話の流れ・文字起こし・翌朝チームが確認する要約でご覧いただけます。ご相談の前にAI音声エージェントを確認したいコールセンター事業者様・事業者様向けです。表示内容はすべて、架空の事業者を用いたシナリオ再生（シミュレーション）です。ご覧いただいた後は、協業または導入についてご相談いただけます。',
  'Choose a scenario': 'シナリオを選択',
  'Pick one of three scenarios to see an example call and the dashboard view.':
    '3つのシナリオから1つ選ぶと、通話例とダッシュボード表示をご覧いただけます。',
  'Scripted simulation': 'シナリオ再生（シミュレーション）',
  'All businesses and callers shown are fictional.': '表示される事業者・発信者はすべて架空です。',
  'Recording and transcription notice': '録音・文字起こしに関するお知らせ',
  // PLACEHOLDER-OFF: full notice with the [TBD] sentence:
  // 'This demo is a scripted simulation. It does not open your microphone and it records nothing from you.\nWhen a live AI call demo is offered, calls will be recorded and transcribed. Retention period: [TBD: owner to confirm]. Who can see them: [TBD: owner to confirm]. Public call length limit: [TBD: owner to confirm, suggested about 3 minutes].':
  //   'このデモは、あらかじめ用意したシナリオを再生するシミュレーションです。マイクは使用せず、お客様の音声は一切録音しません。\nライブAI通話デモを提供する場合、通話は録音・文字起こしされます。保存期間：[TBD：オーナー確認待ち]。閲覧できる者：[TBD：オーナー確認待ち]。公開時の通話時間の上限：[TBD：オーナー確認待ち（目安は約3分）]。',
  'This demo is a scripted simulation. It does not open your microphone and it records nothing from you.':
    'このデモは、あらかじめ用意したシナリオを再生するシミュレーションです。マイクは使用せず、お客様の音声は一切録音しません。',
  'I have read the notice above and agree to continue. See the':
    '上記のお知らせを読み、同意のうえ続行します。詳しくは',
  'privacy policy': 'プライバシーポリシー',
  'Start the demo': 'デモを開始する',
  'Live AI call (integration required)': 'ライブAI通話（連携が必要）',
  'Status: integration required. A live AI call is not available on this page yet.':
    '状況：連携が必要です。現時点では、このページでライブAI通話はご利用いただけません。',
  Scenarios: 'シナリオ',
  'Call transcript (simulation)': '通話の文字起こし（シミュレーション）',
  'Dashboard view': 'ダッシュボード表示',
  Caller: '発信者',
  AI: 'AI',
  'Demo data — dummy values for illustration only.': 'デモデータ：説明用のダミー値です。',
  'Choose another scenario': '別のシナリオを選ぶ',
  'Reservation/ Booking': '予約受付',
  'Listen a Demo': 'デモを聞く',
  'Demo Call': 'デモ通話',
  'A caller phones at night, outside business hours.': '営業時間外の夜間に、発信者が電話をかけてきます。',
  'Busy-time first reception': '混雑時の一次受付',
  'Many calls arrive at once and operators are busy.': '多くの電話が同時に入り、オペレーターが対応中です。',
  'FAQ and callback request': 'よくある質問と折り返し依頼',
  'A routine question, then a request for a callback.': '定型的な質問のあと、折り返しを依頼します。',
  'Sample Call Center (fictional business)': 'サンプルコールセンター（架空の事業者）',
  // Booking scenario conversation removed (video player instead); entries kept for restoring:
  // 'Hello, I would like to ask about my appointment.': 'もしもし、予約について確認したいのですが。',
  // 'Thank you for calling. Our staff are away right now, but I can take your details and pass them on. May I have your name and a number to reach you?':
  //   'お電話ありがとうございます。ただいまスタッフは不在ですが、ご用件を承り、担当者へお伝えします。お名前と、ご連絡のつく電話番号をお願いできますか？',
  // 'Sample Caller, 000-0000-0000 (dummy).': 'サンプル太郎、000-0000-0000です（ダミー）。',
  // 'Thank you. I have noted your request. A person will call you back on the next business day.':
  //   'ありがとうございます。ご用件を承りました。翌営業日に担当者からお電話を差し上げます。',
  // Busy-time and FAQ scenario conversations removed (recordings in the player instead); entries kept for restoring:
  // 'I need to change the delivery date for my order.': '注文した商品の配達日を変更したいのですが。',
  // 'I can help with the first step. Could you tell me your order number?':
  //   '最初のご案内をいたします。ご注文番号を教えていただけますか？',
  // 'It is 0000 (dummy).': '0000です（ダミー）。',
  // 'Thank you. Changes to an existing order are handled by a person, so I will pass this to an operator with the details you gave me.':
  //   'ありがとうございます。既存のご注文の変更は担当者が対応しますので、いただいた内容とあわせてオペレーターにおつなぎします。',
  // 'What are your opening hours?': '営業時間を教えてください。',
  // PLACEHOLDER-OFF:
  // 'Our opening hours are [TBD: owner to confirm]. Would you like a callback from our staff?':
  //   '営業時間は[TBD：オーナー確認待ち]です。スタッフからの折り返しをご希望ですか？',
  // 'Would you like a callback from our staff?': 'スタッフからの折り返しをご希望ですか？',
  // 'Yes, please call me tomorrow afternoon.': 'はい、明日の午後にお電話をお願いします。',
  // 'Noted. I have recorded a callback request for tomorrow afternoon.':
  //   '承知しました。明日の午後の折り返しを依頼として記録しました。',
  Summary: '要約',
  Urgency: '緊急度',
  'Callback status': '折り返し状況',
  'Recommended action': '推奨対応',
  Low: '低',
  Medium: '中',
  'Caller asked about an appointment (dummy).': '発信者は予約について問い合わせ（ダミー）。',
  'Callback requested': '折り返し依頼あり',
  'Call back next business morning': '翌営業日の午前に折り返す',
  'Caller wants to change a delivery date (dummy).': '発信者は配達日の変更を希望（ダミー）。',
  'Handed to operator': 'オペレーターへ引き継ぎ済み',
  'Operator confirms the new date': 'オペレーターが新しい日程を確認する',
  'Asked opening hours, requested an afternoon callback (dummy).':
    '営業時間を質問し、午後の折り返しを依頼（ダミー）。',
  Scheduled: '予定済み',
  'Call back tomorrow afternoon': '明日の午後に折り返す',

  // ── /partners
  'For call centers and BPO operators': 'コールセンター・BPO事業者様向け',
  'Offer an AI voice agent as your own service.': 'AI音声エージェントを、自社サービスとして提供しませんか。',
  'TechMirai works with small and medium-sized call centers as a white-label partner. You bring customers, call flows and operators. We bring the voice AI, conversation design, approved knowledge, dashboard and technical support. AI supports your operators; it does not replace them.':
    'TechMiraiは、中小規模のコールセンター様とホワイトラベルパートナーとして協業します。お客様、通話フロー、オペレーターはパートナー様が、音声AI、会話設計、承認済みナレッジ、ダッシュボード、技術サポートはTechMiraiがご用意します。AIはオペレーターを支援するものであり、置き換えるものではありません。',
  'Founding partner program': '創設パートナープログラム',
  'Benefits and conditions are not confirmed yet and are shown as placeholders for the owner.':
    '特典・条件は未確定のため、オーナー確認用のプレースホルダーとして表示しています。',
  Benefits: '特典',
  // PLACEHOLDER-OFF: '[TBD: owner to confirm founding-partner benefits]': '[TBD：創設パートナーの特典をオーナーが確認]',
  Conditions: '条件',
  // PLACEHOLDER-OFF: '[TBD: owner to confirm conditions]': '[TBD：条件をオーナーが確認]',
  'Commercial terms': '取引条件',
  // PLACEHOLDER-OFF: 'Discussed in consultation. [TBD: OEM / white-label terms]': 'ご相談の中でご案内します。[TBD：OEM／ホワイトラベルの条件]',
  'Proof of concept in four steps': '4ステップのPoC（概念実証）',
  'Test the voice agent on one real task.': '1つの実業務で音声エージェントを検証します。',
  'Measure the result against agreed evaluation measures.': '合意した評価指標で効果を測定します。',
  'Decide together whether to adopt.': '導入するかどうかを一緒に判断します。',
  'Build the production setup.': '本番環境を開発します。',
  'Typical PoC scope': 'PoCの一般的な範囲',
  'Placeholders. The owner confirms the real details.': 'プレースホルダーです。実際の内容はオーナーが確認します。',
  'Target task': '対象業務',
  // PLACEHOLDER-OFF:
  // '[One call type, e.g. after-hours inquiries for one partner client]':
  //   '[1つの通話タイプ（例：パートナー1社の営業時間外の問い合わせ）]',
  Duration: '期間',
  // PLACEHOLDER-OFF: '[X weeks]': '[X週間]',
  'TechMirai delivers': 'TechMiraiの提供内容',
  // PLACEHOLDER-OFF:
  // '[Voice agent configured for the task, approved-knowledge setup, call logs and summaries, dashboard access, test support, evaluation report]':
  //   '[対象業務向けに設定した音声エージェント、承認済みナレッジの設定、通話ログと要約、ダッシュボードの利用、テスト支援、評価レポート]',
  'Partner provides': 'パートナー様のご用意',
  // PLACEHOLDER-OFF:
  // '[One target client or process, call flows and FAQ/manual, test callers or operators, success criteria, a contact person]':
  //   '[対象のお客様または業務1件、通話フローとFAQ・マニュアル、テスト用の発信者またはオペレーター、成功基準、ご担当者]',
  'Suggested evaluation measures': '評価指標（案）',
  'These are measures we suggest tracking. No results are claimed.': '追跡をおすすめする指標です。成果を示すものではありません。',
  'Response and completion': '応答と完了',
  'Response rate, completion rate': '応答率、完了率',
  'Handoffs and callbacks': '引き継ぎと折り返し',
  'Transfer rate, callback rate': '転送率、折り返し率',
  Quality: '品質',
  'Incorrect-answer rate, operator review': '誤回答率、オペレーターによる確認',
  Workload: '業務負荷',
  'Missed-call reduction, handling time, after-call work, abandonment':
    '取りこぼし通話の削減、対応時間、通話後の作業、放棄呼',
  'Talk to us about partnership': '協業についてご相談ください',
  'Tell us about your call center and we will discuss how a proof of concept could work.':
    'コールセンターの状況をお知らせください。PoCの進め方を一緒に検討します。',

  // ── /company
  "TechMirai is an international engineering team building an AI voice agent for call centers and phone desks. This page is for partners and customers who want to know who is behind it. Team photos and videos appear here only with each person's written consent; next, you can contact us.":
    'TechMiraiは、コールセンター・電話窓口向けのAI音声エージェントを開発する、国際的なエンジニアチームです。このページは、開発元について知りたいパートナー様・お客様向けです。チームの写真や動画は、本人の書面による同意がある場合にのみ掲載します。ご不明点はお問い合わせください。',
  Team: 'チーム',
  'International engineering team': '国際的なエンジニアチーム',
  Members: 'メンバー',
  // PLACEHOLDER-OFF:
  // '[TBD: photos, names and roles appear after written consent is recorded]':
  //   '[TBD：書面による同意の記録後に、写真・氏名・役割を掲載]',
  'Company profile': '会社概要',
  'Legal name': '正式名称',
  // PLACEHOLDER-OFF: '[TBD: legal company name]': '[TBD：正式な会社名]',
  Representative: '代表者',
  // PLACEHOLDER-OFF: '[TBD: representative]': '[TBD：代表者]',
  Address: '所在地',
  // PLACEHOLDER-OFF: '[TBD: registered address]': '[TBD：登記上の所在地]',
  Registration: '登録情報',
  // PLACEHOLDER-OFF: '[TBD: registration number]': '[TBD：登録番号]',
  'Get in touch': 'お問い合わせ',
  'Questions about the company or the AI voice agent? Contact us.':
    '会社やAI音声エージェントについてのご質問は、お気軽にお問い合わせください。',
}

const TEXT_KEYS: ReadonlySet<string> = new Set([
  'heading', 'eyebrow', 'pill', 'note', 'body', 'smallPrint', 'intro', 'sub', 'title', 'line', 'label', 'detail', 'footnote', 'text',
  'description', 'businessName', 'simulationLabel', 'fictionalNotice', 'noticeTitle', 'noticeBody', 'consentLabel',
  'privacyLabel', 'startLabel', 'liveLabel', 'liveNote', 'scenarioHeading', 'transcriptHeading', 'summaryHeading',
  'callerLabel', 'aiLabel', 'demoDataLabel', 'restartLabel', 'audioLabel', 'callLabel', 'value',
])

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

function toJa(node: Json, key = ''): Json {
  if (Array.isArray(node)) return node.map((child) => toJa(child, key))
  if (node !== null && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, toJa(v, k)]))
  }
  if (typeof node === 'string' && TEXT_KEYS.has(key)) return JA_EXACT[node] ?? JA_TODO
  return node
}

// PLACEHOLDER-OFF: unconfirmed "last updated / responsible company" note hidden for now.
// const LAST_UPDATED =
//   'Last updated: [TBD: owner to confirm date] · Responsible company: [TBD: legal company name]'

const row = (label: string, detail: string) => ({ label, detail })

const scenario = (
  title: string,
  description: string,
  turns: [string, string][],
  summary: [string, string][],
  media?: Partial<{ audioEn: string; audioJa: string; videoSrc: string; callUrlEn: string; callUrlJa: string }>,
) => ({
  title,
  description,
  businessName: 'Sample Call Center (fictional business)',
  ...(media ?? {}),
  turns: turns.map(([speaker, text]) => ({ speaker, text })),
  summaryRows: summary.map(([label, value]) => ({ label, value })),
})

const demoLayout: Json = [
  {
    blockType: 'page-intro',
    pill: 'Live demo',
    heading: 'Voice demo',
    body: 'This page shows how an AI voice agent handles a call: the conversation, the transcript and the summary your team sees the next morning. It is for call-center operators and businesses that want to see the AI voice agent before a conversation. Everything here is a scripted simulation with a fictional business; next, you can consult us about partnership or adoption.',
    // PLACEHOLDER-OFF: note: LAST_UPDATED,
  },
  {
    blockType: 'demo-simulator',
    heading: 'Choose a scenario',
    intro: 'Pick one of three scenarios to see an example call and the dashboard view.',
    simulationLabel: 'Scripted simulation',
    fictionalNotice: 'All businesses and callers shown are fictional.',
    noticeTitle: 'Recording and transcription notice',
    // PLACEHOLDER-OFF: the second sentence (retention / access / call-length limit, all [TBD]) is hidden:
    // '...\nWhen a live AI call demo is offered, calls will be recorded and transcribed. Retention period: [TBD: owner to confirm]. Who can see them: [TBD: owner to confirm]. Public call length limit: [TBD: owner to confirm, suggested about 3 minutes].'
    noticeBody:
      'This demo is a scripted simulation. It does not open your microphone and it records nothing from you.',
    consentLabel: 'I have read the notice above and agree to continue. See the',
    privacyLabel: 'privacy policy',
    startLabel: 'Start the demo',
    liveLabel: 'Live AI call (integration required)',
    liveNote: 'Status: integration required. A live AI call is not available on this page yet.',
    scenarioHeading: 'Scenarios',
    transcriptHeading: 'Call transcript (simulation)',
    summaryHeading: 'Dashboard view',
    callerLabel: 'Caller',
    aiLabel: 'AI',
    demoDataLabel: 'Demo data — dummy values for illustration only.',
    restartLabel: 'Choose another scenario',
    callLabel: 'Demo Call',
    scenarios: [
      scenario(
        'Reservation/ Booking',
        'A caller phones at night, outside business hours.',
        // Conversation text removed: this scenario shows the video player instead.
        // [
        //   ['caller', 'Hello, I would like to ask about my appointment.'],
        //   ['ai', 'Thank you for calling. Our staff are away right now, but I can take your details and pass them on. May I have your name and a number to reach you?'],
        //   ['caller', 'Sample Caller, 000-0000-0000 (dummy).'],
        //   ['ai', 'Thank you. I have noted your request. A person will call you back on the next business day.'],
        // ],
        [],
        [['Summary', 'Caller asked about an appointment (dummy).'], ['Urgency', 'Low'], ['Callback status', 'Callback requested'], ['Recommended action', 'Call back next business morning']],
        {
          audioEn: '/audio/how-to-book-en.wav',
          audioJa: '/audio/how-to-book-jp.wav',
          videoSrc: '/video/audio-screen.mp4',
          callUrlEn: 'https://techmirai-voice-premium.vercel.app/talk/sakura-seikotsuin/en',
          callUrlJa: 'https://techmirai-voice-premium.vercel.app/talk/sakura-seikotsuin/ja',
        },
      ),
      scenario(
        'Busy-time first reception',
        'Many calls arrive at once and operators are busy.',
        // Conversation text removed: this scenario plays its recording in the player (green panel, no video).
        // [
        //   ['caller', 'I need to change the delivery date for my order.'],
        //   ['ai', 'I can help with the first step. Could you tell me your order number?'],
        //   ['caller', 'It is 0000 (dummy).'],
        //   ['ai', 'Thank you. Changes to an existing order are handled by a person, so I will pass this to an operator with the details you gave me.'],
        // ],
        [],
        [['Summary', 'Caller wants to change a delivery date (dummy).'], ['Urgency', 'Medium'], ['Callback status', 'Handed to operator'], ['Recommended action', 'Operator confirms the new date']],
        { audioEn: '/audio/call-back-en.wav', audioJa: '/audio/call-back-ja.wav' },
      ),
      scenario(
        'FAQ and callback request',
        'A routine question, then a request for a callback.',
        // Conversation text removed: this scenario plays its recording in the player (green panel, no video).
        // [
        //   ['caller', 'What are your opening hours?'],
        //   // PLACEHOLDER-OFF: 'Our opening hours are [TBD: owner to confirm]. ' (first sentence hidden)
        //   ['ai', 'Would you like a callback from our staff?'],
        //   ['caller', 'Yes, please call me tomorrow afternoon.'],
        //   ['ai', 'Noted. I have recorded a callback request for tomorrow afternoon.'],
        // ],
        [],
        [['Summary', 'Asked opening hours, requested an afternoon callback (dummy).'], ['Urgency', 'Low'], ['Callback status', 'Scheduled'], ['Recommended action', 'Call back tomorrow afternoon']],
        { audioEn: '/audio/FAQ-en.wav', audioJa: '/audio/FAQ-ja.wav' },
      ),
    ],
  },
]

const card = (icon: string, tone: string, title: string, text: string) => ({ icon, tone, title, text })

const partnersLayout: Json = [
  {
    blockType: 'page-intro',
    pill: 'For call centers and BPO operators',
    heading: 'Offer an AI voice agent as your own service.',
    body: 'TechMirai works with small and medium-sized call centers as a white-label partner. You bring customers, call flows and operators. We bring the voice AI, conversation design, approved knowledge, dashboard and technical support. AI supports your operators; it does not replace them.',
    primaryButton: { label: 'Consult about partnership', href: '/contact?path=partnership' },
    secondaryButton: { label: 'Try the voice demo', href: '/demo' },
    // PLACEHOLDER-OFF: note: LAST_UPDATED,
  },
  // PLACEHOLDER-OFF: founding partner program block (every card is a [TBD]).
  // {
  //   blockType: 'icon-cards',
  //   pill: 'Partnership',
  //   heading: 'Founding partner program',
  //   intro: 'Benefits and conditions are not confirmed yet and are shown as placeholders for the owner.',
  //   columns: '3',
  //   cards: [
  //     card('shield', 'green', 'Benefits', '[TBD: owner to confirm founding-partner benefits]'),
  //     card('list', 'blue', 'Conditions', '[TBD: owner to confirm conditions]'),
  //     card('fileText', 'amber', 'Commercial terms', 'Discussed in consultation. [TBD: OEM / white-label terms]'),
  //   ],
  // },
  {
    blockType: 'process-steps',
    heading: 'Proof of concept in four steps',
    steps: [
      { title: 'Validate', line: 'Test the voice agent on one real task.' },
      { title: 'Measure the effect', line: 'Measure the result against agreed evaluation measures.' },
      { title: 'Decide on adoption', line: 'Decide together whether to adopt.' },
      { title: 'Production development', line: 'Build the production setup.' },
    ],
  },
  // PLACEHOLDER-OFF: PoC scope block (every card is a bracketed placeholder).
  // {
  //   blockType: 'icon-cards',
  //   pill: 'PoC scope',
  //   heading: 'What a typical PoC covers',
  //   intro: 'Placeholders. The owner confirms the real details.',
  //   columns: '2',
  //   cards: [
  //     card('list', 'green', 'Target task', '[One call type, e.g. after-hours inquiries for one partner client]'),
  //     card('clock', 'blue', 'Duration', '[X weeks]'),
  //     card('headset', 'green', 'TechMirai delivers', '[Voice agent configured for the task, approved-knowledge setup, call logs and summaries, dashboard access, test support, evaluation report]'),
  //     card('users', 'amber', 'Partner provides', '[One target client or process, call flows and FAQ/manual, test callers or operators, success criteria, a contact person]'),
  //   ],
  // },
  {
    blockType: 'icon-cards',
    pill: 'Evaluation',
    heading: 'Suggested evaluation measures',
    intro: 'These are measures we suggest tracking. No results are claimed.',
    columns: '4',
    cards: [
      card('gauge', 'green', 'Response and completion', 'Response rate, completion rate'),
      card('forward', 'blue', 'Handoffs and callbacks', 'Transfer rate, callback rate'),
      card('shield', 'amber', 'Quality', 'Incorrect-answer rate, operator review'),
      card('timer', 'green', 'Workload', 'Missed-call reduction, handling time, after-call work, abandonment'),
    ],
  },
  {
    blockType: 'cta-banner',
    heading: 'Talk to us about partnership',
    body: 'Tell us about your call center and we will discuss how a proof of concept could work.',
    primaryButton: { label: 'Consult about partnership', href: '/contact?path=partnership' },
  },
]

const companyLayout: Json = [
  {
    blockType: 'page-intro',
    pill: 'About us',
    heading: 'Company',
    body: "TechMirai is an international engineering team building an AI voice agent for call centers and phone desks. This page is for partners and customers who want to know who is behind it. Team photos and videos appear here only with each person's written consent; next, you can contact us.",
    primaryButton: { label: 'Consult about adopting the AI voice agent', href: '/contact?path=adoption' },
    // PLACEHOLDER-OFF: note: LAST_UPDATED,
  },
  {
    blockType: 'icon-cards',
    pill: 'Team',
    heading: 'Team',
    columns: '2',
    cards: [
      card('users', 'green', 'Team', 'International engineering team'),
      // PLACEHOLDER-OFF: card('user', 'blue', 'Members', '[TBD: photos, names and roles appear after written consent is recorded]'),
    ],
  },
  // PLACEHOLDER-OFF: company profile block (every card is a [TBD]).
  // {
  //   blockType: 'icon-cards',
  //   pill: 'Company profile',
  //   heading: 'Company profile',
  //   columns: '4',
  //   cards: [
  //     card('building', 'green', 'Legal name', '[TBD: legal company name]'),
  //     card('user', 'blue', 'Representative', '[TBD: representative]'),
  //     card('building', 'amber', 'Address', '[TBD: registered address]'),
  //     card('fileText', 'green', 'Registration', '[TBD: registration number]'),
  //   ],
  // },
  {
    blockType: 'cta-banner',
    heading: 'Get in touch',
    body: 'Questions about the company or the AI voice agent? Contact us.',
    primaryButton: { label: 'Consult about adopting the AI voice agent', href: '/contact?path=adoption' },
  },
]

export interface VoicePageSeed {
  slug: string
  title: { en: string; ja: string }
  en: Json
  ja: Json
}

const page = (slug: string, title: string, layout: Json): VoicePageSeed => ({
  slug,
  title: { en: title, ja: JA_EXACT[title] ?? JA_TODO },
  en: layout,
  ja: toJa(layout),
})

export const VOICE_PAGES: readonly VoicePageSeed[] = [
  page('demo', 'Demo', demoLayout),
  page('partners', 'Partners', partnersLayout),
  page('company', 'Company', companyLayout),
]
