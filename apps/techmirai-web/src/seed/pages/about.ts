import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'
import { richText } from '../lib/rich-text'
import type { MediaIds } from '../media'
import type { TeamIds } from '../team'

/**
 * Pack-3/I2: /about (Spec §10, lines 833-922 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`), plus the
 * §17.4 canonical company-facts sentences the Done-when list also requires
 * on this page. Same `updateLocalizedDoc` pattern as `pages/pricing.ts`.
 * Every string below is copied verbatim from the Spec; brackets preserved
 * exactly per CLAUDE.md rule 5.
 *
 * Founder message (`ceo-message`), the Company-profile "Representative"
 * row (`label-value-list` with `founderGated: true`) and the §17.4
 * sentence naming the founder (`rich-text` with `founderGated: true` —
 * split into its own block from the other 3 non-founder sentences, per
 * docs/WORK-ORDER.md §2.3's explicit instruction that this exact sentence
 * is one of the places the switch must reach) are all filtered at render
 * time by `[locale]/[slug]/page.tsx` when `company-info`'s
 * `founder.visible` is false — see this step's docs/ENGINE-FIXES.md entry.
 * Team's founder card is filtered the same way `team-grid` already is on
 * the homepage.
 *
 * "Our promises" rows are split at the Spec's own bold-markup boundary
 * (label = the bold lead-in, detail = the rest of the same sentence) — not
 * a rewording, just cutting at a boundary the Spec itself marks.
 *
 * Company profile's Item/detail columns come directly from Spec 10.6's
 * "Item (EN)" / "項目 (JA)" and EN/JA columns — not invented labels, unlike
 * `label-value-list`'s other About/Pricing/Security uses, which had to
 * invent short structural headings (see `pages/pricing.ts`'s own comment
 * for that precedent). Address/Main client/Phone/Email repeat facts already
 * tracked under F1-06/F1-14/F1-01/F1-07 in docs/PLACEHOLDER-REGISTER.md.
 */
export async function seedAboutPage(payload: Payload, media: MediaIds, team: TeamIds): Promise<void> {
  const jamalDoc = await payload.findByID({ collection: 'team', id: team.jamal, depth: 0 })
  const jamalPhoto = (jamalDoc as { photo?: unknown })['photo']

  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'A small team in Japan, building front desks for small businesses.',
      body: 'We believe every customer deserves an answer, and every staff member deserves time for the work only people can do.',
      textAlignment: 'left',
    },
    {
      blockType: 'ceo-message',
      portrait: jamalPhoto,
      portraitAlt: 'Placeholder portrait for Jamal Shah — real photo pending written consent (F1-15)',
      name: 'Jamal Shah',
      title: 'Founder, TechMirai',
      // Spec §10.2 DRAFT, seeded as written — see docs/PLACEHOLDER-REGISTER.md I2-01.
      message: richText(
        'Small businesses carry much of Japan’s everyday life: the clinic down the street, the salon, the garage, the family-run hotel. Yet in many of them, skilled people spend a large part of the day answering the same questions and picking up the phone in the middle of other work.',
        'We built AI受付 so the first reply can happen on its own — at 10pm, on a holiday, or in English — and so your staff step in only when it truly matters. We do not believe AI should replace people. We believe it should take the repetitive work off their hands.',
        'We are also honest about what AI cannot do. That is why AI受付 answers with buttons and your own approved words first, uses AI only as a last step, and always shows a way to reach a person.',
        '[Optional: one or two sentences in your own words about why you started TechMirai.]',
        'We started with our first client, Sadiatec, and built every piece ourselves. We would be glad to show you what we have built.',
      ),
    },
    {
      blockType: 'label-value-list',
      heading: 'Our promises',
      rows: [
        {
          label: 'Honest about AI.',
          detail: 'We tell you what AI受付 should not handle, as clearly as what it can.',
        },
        { label: 'You approve every answer.', detail: 'Nothing goes live in your name without your OK.' },
        { label: 'Japanese-language support.', detail: 'Consultations, quotes and support in Japanese.' },
        {
          label: 'One team, build to running.',
          detail: 'The people who build your front desk also support it.',
        },
      ],
    },
    {
      blockType: 'team-grid',
      sectionHeading: 'Our team',
      members: [team.jamal, team.abdullah, team.haruka, team.nahida, team.newEngineer],
      columns: '3',
      showBio: true,
    },
    {
      blockType: 'team-grid',
      sectionHeading: 'Our Japan-based partner',
      members: [],
      partner: {
        photo: media.partnerPhoto,
        name: 'Sadiatec Co., Ltd.',
        role: 'Md. Sanaul Haque, President & CEO',
        line: 'Established in Japan in 2005. An established Japan-based company supporting our local business relationships.',
        clarityLine:
          'TechMirai is an independent business; Sadiatec is our partner, not our parent company. [CONFIRM wording with Mr. Haque]',
      },
      columns: '3',
    },
    {
      blockType: 'label-value-list',
      heading: 'Company profile',
      rows: [
        { label: 'Trade name', detail: 'TechMirai' },
        { label: 'Representative', detail: 'Jamal Shah', founderGated: true },
        {
          label: 'Business form',
          detail: '[Sole proprietorship — CONFIRM, or company name if incorporated]',
        },
        { label: 'Established', detail: '[Month Year]' },
        { label: 'Address', detail: '[Address you may publish]' },
        {
          label: 'Business',
          detail:
            'AI reception systems for small businesses (AI受付) · Website development · AI proof-of-concept development',
        },
        { label: 'Partner', detail: 'Sadiatec Co., Ltd. (Chiyoda-ku, Tokyo; est. 2005)' },
        { label: 'Main client', detail: '[Sadiatec Co., Ltd. — with permission]' },
        { label: 'Phone', detail: '[080-7701-3004]' },
        { label: 'Email', detail: 'info@techmirai-ai.com' },
      ],
    },
    {
      blockType: 'rich-text',
      // Spec §17.4 canonical company-facts sentences 1-3, verbatim — these
      // don't name the founder, so they're never founder-gated.
      content: richText(
        'TechMirai is a Japan-based company that builds AI受付, an AI reception system for small businesses.',
        'AI受付 turns a business’s website into a 24/7 front desk that answers questions, takes reservations, connects with LINE and hands customers to staff.',
        'AI受付 answers in layers: buttons, then approved answers, then AI based on published content, with a person available at every step.',
      ),
      maxWidth: 'prose',
    },
    {
      blockType: 'rich-text',
      // Sentence 4 names the founder — docs/WORK-ORDER.md §2.3 explicitly
      // lists "the canonical company-facts sentence used on About, in
      // schema and in the chatbot (17.4)" as one of the places the founder
      // switch must reach, so this block (and only this one) is gated.
      content: richText(
        'TechMirai was founded by Jamal Shah. Its Japan-based partner is Sadiatec Co., Ltd., established in 2005.',
      ),
      maxWidth: 'prose',
      founderGated: true,
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: '日本の小さなお店のために、受付をつくる小さなチームです。',
      body: 'すべてのお客様に、きちんと答えを。すべてのスタッフに、人にしかできない仕事のための時間を。',
      textAlignment: 'left',
    },
    {
      blockType: 'ceo-message',
      portrait: jamalPhoto,
      portraitAlt: '[JA TODO]',
      name: 'ジャマル・シャー',
      title: 'TechMirai 代表',
      message: richText(
        '日本の毎日の暮らしは、多くの小さなお店や会社に支えられています。街のクリニック、美容室、整備工場、家族で営む宿。けれども、その多くで、専門の技術を持つ方々が一日の多くの時間を、同じ質問への回答や、作業の合間の電話対応に使っています。',
        '私たちがAI受付をつくったのは、夜10時でも、休日でも、英語でも、最初のお返事が自動で届くようにするためです。そして、スタッフの皆さまが本当に必要なときだけ対応すればよいようにするためです。私たちは、AIが人の代わりになるべきだとは考えていません。くり返しの仕事を引き受けて、人の手を空けるためのものだと考えています。',
        '同時に、AIにできないことについても、正直でありたいと考えています。だからAI受付は、まずボタンと、お店が承認した言葉で答え、AIは最後の手段としてだけ使い、どの段階でもスタッフにつながる方法を示します。',
        '[任意：TechMiraiを始めた理由を、ご自身の言葉で一、二文。 (Optional: one or two sentences, in your own words, on why you started TechMirai.)]',
        '最初のお客様であるSadiatec様のプロジェクトから始まり、すべてを自分たちの手で開発してきました。実際に動くものを、ぜひご覧ください。',
      ),
    },
    {
      blockType: 'label-value-list',
      heading: '私たちの約束',
      rows: [
        {
          label: 'AIについて正直に。',
          detail: 'AI受付に任せるべきでないことも、できることと同じくらい、はっきりお伝えします。',
        },
        {
          label: 'すべての回答を、あなたが承認。',
          detail: 'お店の名前で出る言葉は、必ずご確認いただきます。',
        },
        { label: '日本語でサポート。', detail: 'ご相談、お見積り、サポートまで日本語で対応します。' },
        { label: '構築から運用まで、ひとつのチームで。', detail: 'つくったメンバーが、そのままサポートします。' },
      ],
    },
    {
      blockType: 'team-grid',
      sectionHeading: 'チーム',
      members: [team.jamal, team.abdullah, team.haruka, team.nahida, team.newEngineer],
      columns: '3',
      showBio: true,
    },
    {
      blockType: 'team-grid',
      sectionHeading: '日本のパートナー企業',
      members: [],
      partner: {
        photo: media.partnerPhoto,
        name: 'Sadiatec Co., Ltd.',
        role: '代表取締役社長 (president and representative director)　Md. Sanaul Haque',
        line: '2005年に日本で設立。私たちの国内での事業展開を支えていただいているパートナー企業です。',
        clarityLine:
          'TechMiraiは独立した事業であり、Sadiatecは親会社ではなくパートナー企業です。[表現をHaque様に確認]',
      },
      columns: '3',
    },
    {
      blockType: 'label-value-list',
      heading: '会社概要',
      rows: [
        { label: '屋号', detail: 'TechMirai（[テックミライ]）' },
        { label: '代表者', detail: 'ジャマル・シャー', founderGated: true },
        { label: '事業形態', detail: '[個人事業 — 確認中、法人化済みの場合は法人名]' },
        { label: '創業', detail: '[年月]' },
        { label: '所在地', detail: '[掲載可能な住所]' },
        {
          label: '事業内容',
          detail: '中小企業・店舗向けAI受付システムの開発・提供／ホームページ制作／AIのPoC（概念実証）開発',
        },
        { label: 'パートナー', detail: 'Sadiatec Co., Ltd.（東京都千代田区、2005年設立）' },
        { label: '主な取引先', detail: '[Sadiatec Co., Ltd. — 掲載許可を確認]' },
        { label: '電話', detail: '[080-7701-3004]' },
        { label: 'メール', detail: 'info@techmirai-ai.com' },
      ],
    },
    {
      blockType: 'rich-text',
      content: richText(
        'TechMiraiは、中小企業・店舗のためのAI受付システム「AI受付」を開発する、日本を拠点とした事業者です。',
        'AI受付は、お店のホームページを、質問への回答、予約の受付、LINE連携、スタッフへの引き継ぎを24時間行う受付に変えます。',
        'AI受付は、ボタン、承認済みの回答、公開情報にもとづくAIの順に段階的に答え、どの段階でもスタッフにつながります。',
      ),
      maxWidth: 'prose',
    },
    {
      blockType: 'rich-text',
      content: richText('TechMiraiの代表はジャマル・シャーです。日本でのパートナー企業は、2005年設立のSadiatec Co., Ltd.です。'),
      maxWidth: 'prose',
      founderGated: true,
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'about', { en: { layout: enLayout }, ja: { layout: jaLayout } })

  payload.logger.info('🏢 /about content seeded (Spec §10, §17.4)')
}
