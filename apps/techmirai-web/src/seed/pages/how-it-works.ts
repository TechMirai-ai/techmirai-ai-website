import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Pack-3/H3: /how-it-works (Spec §8.1, lines 648-701 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Same
 * `updateLocalizedDoc` pattern as `pages/ai-reception.ts`. Every string
 * below is copied verbatim; brackets preserved exactly per CLAUDE.md rule 5.
 *
 * No closing `cta-banner` — unlike `/ai-reception` (which Spec §6 explicitly
 * ties to the 5.14 CTA block), Spec §8 gives no equivalent instruction for
 * this page. It ends on `setup-steps`' own under-table line instead
 * (confirmed judgment call, see the H3 plan).
 *
 * The five-step customer journey reuses `process-steps` with only `line`
 * populated (no per-step title in the Spec) — this needed `process-steps`'
 * `title` field loosened from required to optional (Pack-3/H3 engine fix).
 *
 * The diagram's dashed "talk to a person" route label reuses the Spec's own
 * already-approved "Talk to a person" / "スタッフと話す" pair (used
 * elsewhere for the same affordance — the always-visible header link and
 * chatbot button B6), not the 4th answer-layer's "A person"/"スタッフ".
 */
export async function seedHowItWorksPage(payload: Payload): Promise<void> {
  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'Simple questions should be answered simply.',
      body: 'Not every question needs AI. AI受付 answers in layers, and only goes deeper when it has to.',
      textAlignment: 'left',
    },
    {
      blockType: 'process-steps',
      steps: [
        { title: 'Buttons', line: 'The customer taps what they need. Instant, and it shows exactly the answer you approved.' },
        { title: 'Your own answers', line: "Typed questions are matched against the answers you approved. Your wording, not a machine's." },
        { title: 'AI', line: 'Used only when the first two find nothing, and based on the content published on your website.' },
        { title: 'A person', line: 'A visible way to reach your staff, at every single step.' },
      ],
    },
    {
      blockType: 'layered-answers-diagram',
      steps: [
        { label: 'Buttons' },
        { label: 'Your own answers' },
        { label: 'AI' },
        { label: 'A person' },
      ],
    },
    {
      blockType: 'security-points',
      points: [
        { text: 'Availability, prices and appointment times always come from your real booking data — never from AI.' },
        { text: 'Customers are always told they are talking to an automated assistant.' },
      ],
    },
    {
      blockType: 'process-steps',
      steps: [
        { line: 'Finds you on Google Maps or Instagram' },
        { line: 'Opens your website and asks a question in chat' },
        { line: 'Picks a service and a free time slot' },
        { line: 'Receives the confirmation in LINE or by email' },
        { line: 'Gets a reminder before the visit; changes or cancels in a few taps if needed' },
      ],
    },
    {
      blockType: 'security-points',
      points: [
        { text: 'An email for every new booking and cancellation' },
        { text: 'All bookings in one admin panel' },
        { text: 'Answers, hours, services and prices updated by your staff, with no coding' },
        { text: 'Staff accounts with separate permissions' },
      ],
    },
    {
      blockType: 'setup-steps',
      steps: [
        { name: 'Assessment', description: 'We review your site and inquiry flow', need: 'Your website address' },
        { name: 'Design', description: 'We agree what AI answers, what staff handle, and the booking rules', need: '30–60 minutes of your time; your most common questions' },
        { name: 'Build', description: 'We build the site and load approved answers', need: 'Hours, services, prices, photos, logo' },
        { name: 'Integration', description: 'We connect LINE, notifications and agreed tools', need: 'Access to your LINE Official Account and domain' },
        { name: 'Test', description: 'You try every flow before customers do', need: 'One staff member to test for a few days' },
        { name: 'Launch', description: 'Go live, then monthly support', need: 'Approval to publish' },
      ],
      footnote: 'No list of questions yet? We draft one from your website and what your staff hear every day.',
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'シンプルな質問には、シンプルに答える。',
      body: 'すべての質問に、AIが必要なわけではありません。AI受付は段階的に答え、必要なときだけ次の段階へ進みます。',
      textAlignment: 'left',
    },
    {
      blockType: 'process-steps',
      steps: [
        { title: 'ボタン', line: 'お客様は必要な項目をタップするだけ。すぐに、承認いただいた回答をそのまま表示します。' },
        { title: '承認済みの回答', line: '入力されたご質問を、承認済みの回答と照らし合わせます。言葉づかいも、あなたが決めたとおりです。' },
        { title: 'AI', line: '上の2つで見つからないときだけ使います。根拠にするのは、ホームページに公開している内容です。' },
        { title: 'スタッフ', line: 'どの段階でも、スタッフへの連絡手段が見えるようにしています。' },
      ],
    },
    {
      blockType: 'layered-answers-diagram',
      steps: [
        { label: 'ボタン' },
        { label: '承認済みの回答' },
        { label: 'AI' },
        { label: 'スタッフ' },
      ],
    },
    {
      blockType: 'security-points',
      points: [
        { text: '空き状況・料金・予約時間は、必ず実際の予約データから表示します。AIが作ることはありません。' },
        { text: 'お客様には、自動応答であることを必ずお知らせしています。' },
      ],
    },
    {
      blockType: 'process-steps',
      steps: [
        { line: 'GoogleマップやInstagramでお店を見つける' },
        { line: 'ホームページを開き、チャットで質問する' },
        { line: 'サービスと空いている日時を選ぶ' },
        { line: 'LINEまたはメールで確認通知を受け取る' },
        { line: 'ご来店前にリマインドが届き、必要なら数タップで変更・キャンセル' },
      ],
    },
    {
      blockType: 'security-points',
      points: [
        { text: '新しい予約とキャンセルのたびに、メールでお知らせ' },
        { text: 'すべての予約を、ひとつの管理画面で確認' },
        { text: '回答・営業時間・サービス・料金は、プログラミングなしでスタッフが更新' },
        { text: '権限を分けたスタッフ用アカウント' },
      ],
    },
    {
      blockType: 'setup-steps',
      steps: [
        { name: '無料診断', description: 'ホームページとお問い合わせの流れを確認', need: 'ホームページのURL' },
        { name: '設計', description: 'AIが答える範囲、スタッフの対応範囲、予約のルールを決定', need: '30〜60分ほどのお時間、よくあるご質問' },
        { name: '構築', description: 'サイトを構築し、承認済みの回答を登録', need: '営業時間、サービス内容、料金、写真、ロゴ' },
        { name: '連携', description: 'LINE、通知、決定したツールと連携', need: 'LINE公式アカウントとドメインの管理権限' },
        { name: 'テスト', description: '公開前に、すべての流れをご確認', need: '数日間、確認いただくスタッフの方1名' },
        { name: '公開', description: '公開、その後は月額サポート', need: '公開のご承認' },
      ],
      footnote: 'よくあるご質問がまとまっていなくても大丈夫です。ホームページの内容や、スタッフの方が日々受けるご質問をもとに、私たちが下書きします。',
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'how-it-works', {
    en: { layout: enLayout },
    ja: { layout: jaLayout },
  })

  payload.logger.info('⚙️ /how-it-works content seeded (Spec §8.1)')
}
