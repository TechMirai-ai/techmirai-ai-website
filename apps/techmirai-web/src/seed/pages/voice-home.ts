import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Voice-pivot home page (docs/ECC MASTER PROMPT TechMirai Voice Website v2.md
 * §6), laid out like the owner's reference screenshot
 * (docs/screenshots/screenshot.jpeg). Exactly 6 sections:
 *   1 Hero (animated call flow)        4 Live demo teaser
 *   2 Problems                         5 Partnership + PoC
 *   3 How it works (day timeline,      6 Final CTA
 *     routing + dashboard, AI/people)
 *
 * Japanese: strings the prompt gives in Japanese are copied exactly (the
 * *_JA constants); the rest is read from the screenshot or is DRAFT written at
 * the owner's request (docs/PLACEHOLDER-REGISTER.md V1-01, native review
 * needed). Deliberate differences from the screenshot, because the ECC prompt
 * wins: no case-study/engineering-track claims, the demo is described as a
 * scripted simulation, no phone-environment wording, no photos of people.
 */
export const JA_TODO = '[JA TODO]'

const HERO_LABEL_JA = 'コールセンター・電話窓口向け AI音声エージェント'
const HERO_HEADLINE_JA = '電話が集中する時間も、営業時間外も。AIが一次対応を支えます。'
const HERO_BODY_JA =
  '定型的な問い合わせ・混雑時・営業時間外の電話にAIが一次対応し、通話を記録・要約して、必要な対応はスタッフへ。コールセンター事業者様は、自社サービスとして提供できます。'
const DEMO_BUTTON_JA = '音声デモを体験する'
const PARTNER_BUTTON_JA = '協業について相談する'
const ADOPT_BUTTON_JA = 'AI音声エージェントの導入を相談する'
const POC_JA = ['検証', '効果測定', '導入判断', '本番開発'] as const
// Served from apps/techmirai-web/public/video; the same file is used for both locales.
const HERO_VIDEO = '/video/hero-section-background.mp4'

const t = (text: string) => ({ text })
const items = (list: string[]) => list.map(t)

interface Copy {
  hero: Record<string, unknown>
  problems: Record<string, unknown>
  dayFlow: Record<string, unknown>
  routing: Record<string, unknown>
  roles: Record<string, unknown>
  demo: Record<string, unknown>
  poc: Record<string, unknown>
  cta: Record<string, unknown>
}

const en: Copy = {
  hero: {
    pill: 'AI voice agent for call centers and phone desks',
    heading: 'Even when calls surge, even outside business hours, AI supports first-line response.',
    body: 'AI gives first-line response to routine, busy-time and after-hours calls, records and summarizes them, and passes what needs a person to staff. Call-center operators can offer it as their own service.',
    primaryButton: { label: 'Try the voice demo', href: '/demo' },
    secondaryButton: { label: 'Consult about partnership', href: '/contact?path=partnership' },
    // PLACEHOLDER-OFF: note: 'Last updated: [TBD: owner to confirm date] · Responsible company: [TBD: legal company name]',
    backgroundVideo: HERO_VIDEO,
    pauseLabel: 'Pause animation',
    playLabel: 'Play animation',
    nodes: [
      { icon: 'phone', label: 'Phone call', sub: 'A customer calls' },
      { icon: 'users', label: 'Operators', sub: 'Busy or queued' },
      { icon: 'audio', label: 'AI first response', sub: 'Triage and guidance' },
      { icon: 'bookOpen', label: 'Approved knowledge', sub: 'FAQ · RAG' },
      { icon: 'fileText', label: 'Call summary and record', sub: '' },
      { icon: 'user', label: 'Complex inquiries go to a person', sub: '' },
    ],
  },
  problems: {
    pill: 'Common challenges',
    heading: 'Do any of these sound familiar?',
    columns: '4',
    cards: [
      { icon: 'users', tone: 'green', title: 'Call surges and waiting', text: 'At peak times calls do not get through and customers wait too long.' },
      { icon: 'moon', tone: 'blue', title: 'Missed after-hours calls', text: 'Calls at night and on holidays go unanswered and opportunities are lost.' },
      { icon: 'message', tone: 'green', title: 'More routine inquiries', text: 'Answering frequently asked questions takes up staff time.' },
      { icon: 'help', tone: 'amber', title: 'Incomplete callback information', text: 'It is unclear who called, so callbacks cannot be prioritized.' },
    ],
  },
  dayFlow: {
    pill: 'A day with the voice agent',
    heading: 'The right response for every time of day',
    steps: [
      { icon: 'sun', tone: 'day', title: 'Regular hours', text: 'Operators and AI work together' },
      { icon: 'users', tone: 'dusk', title: 'Busy periods', text: 'AI answers first and sorts the calls' },
      { icon: 'moon', tone: 'night', title: 'After hours', text: 'AI answers automatically and records' },
      { icon: 'sunrise', tone: 'morning', title: 'Next morning', text: 'Review summaries and prioritize follow-up' },
    ],
  },
  routing: {
    pill: 'Flexible call routing',
    heading: 'The right path for each condition',
    statusBadge: 'Consultation option: designed together with you',
    leftItems: [
      { icon: 'phone', text: 'All incoming calls' },
      { icon: 'list', text: 'Specific numbers or categories' },
      { icon: 'clock', text: 'Time of day' },
      { icon: 'gauge', text: 'Busy periods and overflow calls' },
      { icon: 'hourglass', text: 'Wait-time threshold' },
    ],
    rightItems: [
      { icon: 'route', text: 'First response and sorting' },
      { icon: 'forward', text: 'Transfer to a person' },
      { icon: 'voicemail', text: 'Take a message' },
      { icon: 'calendar', text: 'Callback scheduling' },
    ],
    note: 'After reviewing your current workflow, we will propose the best configuration.',
    dashboard: {
      menuHeading: 'Menu',
      menu: items(['Dashboard', 'Call list', 'Summaries', 'Settings']),
      listTitle: 'Call list (demo data)',
      filters: items(['All', 'Handled', 'Needs action', 'Callback']),
      columns: items(['Time', 'Caller', 'Topic', 'Status']),
      rows: [
        { time: '09:12', caller: '090-1234-5678', topic: 'Change request', status: 'Handled', tone: 'ok' },
        { time: '09:05', caller: '080-9876-5432', topic: 'About fees', status: 'Needs callback', tone: 'alert' },
        { time: '08:58', caller: '03-1234-5678', topic: 'Opening hours', status: 'Handled', tone: 'ok' },
        { time: '08:41', caller: '070-1111-2222', topic: 'Confirmation', status: 'Handled', tone: 'ok' },
      ],
      detailTitle: 'Call detail (demo data)',
      detailRows: [
        { label: 'Caller', value: '090-1234-5678' },
        { label: 'Category', value: 'Change request' },
        { label: 'Summary', value: 'Wants a different date' },
        { label: 'Urgency', value: 'Normal' },
        { label: 'Status', value: 'Needs callback' },
      ],
      audioLabel: 'Call audio · transcript',
      demoLabel: 'Demo data',
    },
  },
  roles: {
    pill: 'Roles of AI and people',
    heading: 'Safe operation for better service',
    aiHeading: 'What AI handles',
    aiItems: items([
      'Routine inquiries',
      'Initial reception and guidance',
      'Answers based on approved information',
      'After-hours reception and recording',
      'Callback scheduling',
    ]),
    humanHeading: 'What people handle',
    humanItems: items([
      'Complaints and troubles',
      'Personal and sensitive information',
      'Exceptions and irregular cases',
      'Negotiation and coordination',
      'When identity cannot be confirmed',
      'Cases that need advanced judgment',
    ]),
    tagline: 'AI supports,\npeople stay close.\nThat is the TechMirai way.',
  },
  demo: {
    pill: 'Live demo',
    heading: 'Experience how a call is handled',
    intro: 'The demo is a scripted simulation with fictional businesses. It is not a real phone line.',
    columns: '4',
    cards: [
      { icon: 'moon', tone: 'blue', title: 'Reservation/ Booking', text: '(e.g. checking an appointment)' },
      { icon: 'users', tone: 'green', title: 'Busy-time first reception', text: '(e.g. changing a delivery date)' },
      { icon: 'help', tone: 'amber', title: 'FAQ and callback request', text: '(e.g. asking opening hours)' },
    ],
    cta: { label: 'Start the demo', href: '/demo', subLabel: 'See the demo notice', subHref: '/demo' },
  },
  poc: {
    heading: 'White-label partnership, proven in four steps',
    sub: 'Call-center operators bring customers, call flows and operators; TechMirai brings the voice AI, approved knowledge, dashboard and technical support.',
    steps: [
      // PLACEHOLDER-OFF: ' [TBD: owner to confirm scope]' (trailing sentence hidden)
      { title: 'Validate', line: 'Start with one call type for one partner client.' },
      { title: 'Measure the effect', line: 'Compare agreed measures such as response, completion and transfer rates.' },
      { title: 'Decide on adoption', line: 'Review the results together and decide whether to go ahead.' },
      { title: 'Production development', line: 'Build and launch the production setup with the partner.' },
    ],
  },
  cta: {
    heading: 'Talk to us',
    body: 'Choose the path that fits you. You can also download a short overview for internal approval (ringi).',
    primaryButton: { label: 'Consult about adopting the AI voice agent', href: '/contact?path=adoption' },
    secondaryButton: { label: 'Consult about partnership', href: '/contact?path=partnership', variant: 'outline' },
    textLink: { label: 'Download the overview for internal approval (PDF)', href: '/contact#ringi' },
  },
}

const ja: Copy = {
  hero: {
    pill: HERO_LABEL_JA,
    heading: HERO_HEADLINE_JA,
    body: HERO_BODY_JA,
    primaryButton: { label: DEMO_BUTTON_JA, href: '/demo' },
    secondaryButton: { label: PARTNER_BUTTON_JA, href: '/contact?path=partnership' },
    // PLACEHOLDER-OFF: note: '最終更新日：[TBD：オーナー確認待ち]・責任主体：[TBD：正式な会社名]',
    backgroundVideo: HERO_VIDEO,
    pauseLabel: 'アニメーションを一時停止',
    playLabel: 'アニメーションを再生',
    nodes: [
      { icon: 'phone', label: 'お電話', sub: 'お客様からの着信' },
      { icon: 'users', label: 'オペレーター', sub: '対応中・混雑' },
      { icon: 'audio', label: 'AIが一次対応', sub: '選別・案内' },
      { icon: 'bookOpen', label: '承認済みナレッジ', sub: 'FAQ・RAG' },
      { icon: 'fileText', label: '通話要約・記録', sub: '' },
      { icon: 'user', label: '複雑な問い合わせは人へ引き継ぎ', sub: '' },
    ],
  },
  problems: {
    pill: 'よくある課題',
    heading: 'こんなお悩みはありませんか？',
    columns: '4',
    cards: [
      { icon: 'users', tone: 'green', title: '電話の集中・待ち時間', text: 'ピーク時に電話がつながらない、お客様を長く待たせてしまう。' },
      { icon: 'moon', tone: 'blue', title: '営業時間外の取りこぼし', text: '夜間・休日の電話に対応できず、機会を逃してしまう。' },
      { icon: 'message', tone: 'green', title: '定型的な問い合わせの増加', text: 'よくある質問への対応に人手がかかる。' },
      { icon: 'help', tone: 'amber', title: '折り返し連絡の情報不足', text: '誰からの電話か分からず、対応の優先順位がつけられない。' },
    ],
  },
  dayFlow: {
    pill: '1日の流れ',
    heading: '時間帯に合わせて、最適な対応を',
    steps: [
      { icon: 'sun', tone: 'day', title: '通常時間', text: 'オペレーターとAIで対応' },
      { icon: 'users', tone: 'dusk', title: '混雑時', text: 'AIが一次対応・振り分け' },
      { icon: 'moon', tone: 'night', title: '営業時間外', text: 'AIが自動で対応・記録' },
      { icon: 'sunrise', tone: 'morning', title: '翌朝', text: '要約を確認し、優先対応' },
    ],
  },
  routing: {
    pill: '柔軟な通話ルーティング',
    heading: 'さまざまな条件で、最適な対応へ',
    statusBadge: 'ご相談オプション：お客様と一緒に設計します',
    leftItems: [
      { icon: 'phone', text: 'すべての着信' },
      { icon: 'list', text: '特定の番号・カテゴリ' },
      { icon: 'clock', text: '時間帯の指定' },
      { icon: 'gauge', text: '混雑・あふれ呼' },
      { icon: 'hourglass', text: '待ち時間のしきい値' },
    ],
    rightItems: [
      { icon: 'route', text: '一次対応・振り分け' },
      { icon: 'forward', text: '人への転送' },
      { icon: 'voicemail', text: 'メッセージの取得' },
      { icon: 'calendar', text: '折り返し予約' },
    ],
    note: '※現在の業務フローを確認したうえで、最適な設定をご提案します。',
    dashboard: {
      menuHeading: 'メニュー',
      menu: items(['ダッシュボード', '通話一覧', '要約・文字起こし', '設定']),
      listTitle: '通話一覧（デモデータ）',
      filters: items(['すべて', '対応済み', '要対応', '折り返し']),
      columns: items(['日時', '発信者', '内容', 'ステータス']),
      rows: [
        { time: '09:12', caller: '090-1234-5678', topic: '内容の変更', status: '対応済み', tone: 'ok' },
        { time: '09:05', caller: '080-9876-5432', topic: '料金について', status: '要コールバック', tone: 'alert' },
        { time: '08:58', caller: '03-1234-5678', topic: '営業時間', status: '対応済み', tone: 'ok' },
        { time: '08:41', caller: '070-1111-2222', topic: '内容の確認', status: '対応済み', tone: 'ok' },
      ],
      detailTitle: '通話詳細（デモデータ）',
      detailRows: [
        { label: '発信者', value: '090-1234-5678' },
        { label: 'カテゴリ', value: '内容の変更' },
        { label: '要約', value: '日程の変更を希望' },
        { label: '緊急度', value: '通常' },
        { label: '対応状況', value: '要コールバック' },
      ],
      audioLabel: '通話音声・文字起こし',
      demoLabel: 'デモデータ',
    },
  },
  roles: {
    pill: 'AIと人の役割分担',
    heading: '安全な運用設計で、より良い対応を',
    aiHeading: 'AIが対応すること',
    aiItems: items([
      '定型的な問い合わせ',
      '初期受付・ご案内',
      '承認済みの情報に基づく回答',
      '営業時間外の受付・記録',
      '折り返しの予約',
    ]),
    humanHeading: '人が対応すること',
    humanItems: items([
      'クレーム・トラブル',
      '個人情報・機微情報',
      '例外対応・イレギュラー',
      '交渉・調整',
      '本人確認が取れない場合',
      '高度な判断が必要な案件',
    ]),
    tagline: 'AIが支え、\n人が寄り添う。\nそれが、TechMiraiのスタイルです。',
  },
  demo: {
    pill: 'ライブデモ',
    heading: '通話の流れを、ぜひ体験してください',
    intro: 'デモは、架空の事業者を用いたシナリオ再生（シミュレーション）です。実際の電話回線ではありません。',
    columns: '4',
    cards: [
      { icon: 'moon', tone: 'blue', title: '予約受付', text: '（例：予約の確認）' },
      { icon: 'users', tone: 'green', title: '混雑時の一次受付', text: '（例：配達日の変更）' },
      { icon: 'help', tone: 'amber', title: 'よくある質問・折り返し依頼', text: '（例：営業時間の確認）' },
    ],
    cta: { label: 'デモを開始する', href: '/demo', subLabel: 'デモの注意事項を見る', subHref: '/demo' },
  },
  poc: {
    heading: 'ホワイトラベルでの協業を、4ステップで確かめる',
    sub: 'お客様・通話フロー・オペレーターはコールセンター事業者様が、音声AI・承認済みナレッジ・ダッシュボード・技術サポートはTechMiraiがご用意します。',
    steps: [
      // PLACEHOLDER-OFF: '[TBD：範囲はオーナー確認待ち]' (trailing sentence hidden)
      { title: POC_JA[0], line: 'パートナー様のお客様1社の、1つの通話タイプから始めます。' },
      { title: POC_JA[1], line: '応答率・完了率・転送率など、合意した指標で比較します。' },
      { title: POC_JA[2], line: '結果を一緒に確認し、進めるかどうかを判断します。' },
      { title: POC_JA[3], line: 'パートナー様とともに、本番環境を開発し公開します。' },
    ],
  },
  cta: {
    heading: 'お気軽にご相談ください',
    body: 'ご希望に合わせてお選びください。社内稟議用の概要資料もダウンロードできます。',
    primaryButton: { label: ADOPT_BUTTON_JA, href: '/contact?path=adoption' },
    secondaryButton: { label: PARTNER_BUTTON_JA, href: '/contact?path=partnership', variant: 'outline' },
    textLink: { label: '稟議用の概要資料をダウンロード（PDF）', href: '/contact#ringi' },
  },
}

function buildLayout(c: Copy) {
  return [
    { blockType: 'voice-hero', ...c.hero },
    { blockType: 'icon-cards', ...c.problems },
    { blockType: 'day-flow', ...c.dayFlow },
    { blockType: 'routing-dashboard', ...c.routing },
    { blockType: 'role-split', ...c.roles },
    { blockType: 'icon-cards', ...c.demo },
    { blockType: 'process-steps', ...c.poc },
    { blockType: 'cta-banner', ...c.cta },
  ]
}

export async function seedVoiceHome(payload: Payload): Promise<void> {
  await updateLocalizedDoc(payload, 'pages', 'home', {
    en: { title: 'Home', layout: buildLayout(en) },
    ja: { title: 'ホーム', layout: buildLayout(ja) },
  })
}
