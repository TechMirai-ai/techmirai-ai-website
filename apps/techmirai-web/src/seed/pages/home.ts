import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'
import siteConfig from '../../../site.config'
import type { MediaIds } from '../media'
import type { TeamIds } from '../team'
import type { DownloadIds } from '../downloads'

/**
 * Pack-3/G1-G4: Homepage content (Spec §5.1-5.14) — Hero, Problem section,
 * Before/After table (G1), capability cards + "AI does not replace staff"
 * sub-block, and the live-demo + industry-tiles block (G2), tools
 * compatibility, implementation process, case-study teaser, pricing teaser
 * and security points (G3), company/team, PoC callout, FAQ teaser and the
 * final call to action (G4). Writes real `layout` content into the `home`
 * pages-collection doc that Pack-2/F3 seeded empty. Uses `updateLocalizedDoc`
 * (not `upsertBySlug`, which no-ops once the doc exists) — see the G1 plan's
 * "seed approach" decision. Every string below is copied verbatim from
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md` lines
 * 243-467 (plus the FAQ Q&A at lines 1176-1217); brackets preserved exactly
 * per CLAUDE.md rule 5. The case-study-teaser block's `visible` flag and the
 * homepage `faq` block's `items` are deliberately not seeded here — both
 * are injected/resolved at render time (see page.tsx).
 */
export async function seedHomePage(
  payload: Payload,
  media: MediaIds,
  team: TeamIds,
  downloads: DownloadIds,
): Promise<void> {
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
    {
      blockType: 'capability-cards',
      heading: 'One front desk, behind every channel.',
      intro:
        'Customers reach you through your website, chat, LINE, social media and, soon, the phone. AI受付 answers all of them from one set of information that you approve.',
      cards: [
        {
          label: 'AI chat',
          status: 'available',
          description: 'Answers questions about your services, hours and access, using information you approved.',
        },
        {
          label: 'AI agent',
          status: 'available',
          description:
            'Guides customers step by step: helps them choose a service, checks availability and completes the booking.',
        },
        {
          label: 'Online booking',
          status: 'available',
          description: 'Real-time availability from your schedule. Two customers can never take the same slot.',
        },
        {
          label: 'LINE',
          status: 'available',
          description: 'Customers book, receive confirmations and reminders, and change or cancel — all inside LINE.',
        },
        {
          label: 'Social media',
          status: 'available',
          description:
            'Links from Instagram, Google Maps and your other profiles take customers straight to chat or booking.',
        },
        {
          label: 'Voice',
          status: 'in-development',
          description:
            'An AI phone receptionist that answers calls from the same approved information. Demo available.',
        },
        {
          label: 'Human handoff',
          status: 'available',
          description: 'A visible way to reach your staff at every step. Staff take over the moment it matters.',
        },
      ],
      badgeRow:
        'Japanese and English · Admin panel your staff can update · Notifications to staff for every booking',
      splitHeading: 'AI handles the repetitive work. Your staff handle what matters.',
      splitLeftTitle: 'AI受付 handles',
      splitLeftItems: [
        { text: 'Frequently asked questions' },
        { text: 'Business hours' },
        { text: 'Service information' },
        { text: 'Basic reservations' },
        { text: 'Directions and access' },
        { text: 'Routine inquiries' },
        { text: 'Connecting customers with the right staff member' },
      ],
      splitRightTitle: 'Your staff handle',
      splitRightItems: [
        { text: 'Complex consultations' },
        { text: 'Complaints' },
        { text: 'Sensitive situations' },
        { text: 'Special requests' },
        { text: 'Important customer conversations' },
      ],
      splitClosingLine:
        'Let AI handle repetitive reception work, so your staff can focus on customers and on work that needs a person.',
    },
    {
      blockType: 'live-demo',
      heading: 'Experience it yourself.',
      body: 'Our demo is a working clinic website. Ask the reception chat a question, book a real appointment, receive the confirmation, then change or cancel it yourself — exactly as your customers would.',
      checklistItems: [
        { text: 'Browse in Japanese or English' },
        { text: 'Ask the reception chat a question' },
        { text: 'Book a real appointment' },
        { text: 'Receive a confirmation' },
        { text: 'Change or cancel it yourself' },
      ],
      buttonLabel: 'Open the live demo',
      buttonHref: demoUrl,
      qrCaption: 'Scan to try it on your phone, exactly as a customer would.',
      smallPrint: '[Demo clinic name] is a fictional clinic created for this demo.',
      // No JA given anywhere in the Spec for these three (brochure not in
      // this repo) — [JA TODO], registered as G2-01.
      threeStepStrip: [{ text: 'Choose a service' }, { text: 'pick a time' }, { text: 'confirmed' }],
      tiles: [
        {
          label: 'Clinics & treatment rooms',
          description:
            'Bookings, first-visit questions and reminders. Fewer calls during treatment. Live demo available.',
          href: '/solutions/clinic',
          buttonLabel: 'See how it works for you.',
        },
        {
          label: 'Beauty salons',
          description: 'Menu questions, LINE booking and easy rebooking while your hands are busy.',
          href: '/solutions/beauty',
          buttonLabel: 'See how it works for you.',
        },
        {
          label: 'Auto service & dealers',
          description: 'Inspection and maintenance bookings, hours and estimate requests.',
          href: '/solutions/automobile',
          buttonLabel: 'See how it works for you.',
        },
        {
          label: 'Hotels & guesthouses',
          description: "Guests' questions answered in Japanese and English, at any hour.",
          href: '/solutions/hotel',
          buttonLabel: 'See how it works for you.',
        },
        {
          label: 'Restaurants',
          description: 'Hours, menu questions and table reservations.',
          href: '/contact',
          buttonLabel: 'Ask us.',
        },
        {
          label: 'Real estate',
          description: 'Property inquiries, viewing appointments and after-hours questions.',
          href: '/contact',
          buttonLabel: 'Ask us.',
        },
      ],
    },
    {
      blockType: 'tools-compatibility',
      heading: 'Keep the tools you already use.',
      body: "Most businesses already have a phone number, a LINE account, social media and sometimes a booking system. We build around them instead of making you start over. In the free assessment we tell you exactly what connects and what doesn't.",
      col1Title: 'Works out of the box',
      col1List: 'LINE Official Account · Your own domain · Email notifications · Links from Google Maps and Instagram',
      col2Title: 'Case by case',
      col2List: 'Your current booking system, if it offers a connection (API) or data export · External calendars',
      col3Title: "If it can't connect",
      col3Body:
        "AI受付's booking can take over, or your staff receive an instant notification for every booking, so nothing is missed.",
      linkLabel: 'See all integrations',
      linkHref: '/integrations',
    },
    {
      blockType: 'process-steps',
      heading: 'From first conversation to launch, we do the work.',
      sub: 'No AI expertise required. Typical timeline: [X weeks] after we receive your content.',
      steps: [
        { title: 'Assessment', line: 'We review your website and how inquiries reach you today.' },
        {
          title: 'Design',
          line: 'We agree what AI受付 answers, what staff handle, and how booking works.',
        },
        { title: 'Build', line: 'We build or upgrade your website and load your approved answers.' },
        {
          title: 'Integration',
          line: 'We connect LINE, notifications and the tools agreed in design.',
        },
        { title: 'Test', line: 'You and your staff try every flow before customers do.' },
        { title: 'Launch', line: 'We go live and stay with you through monthly support.' },
      ],
    },
    {
      blockType: 'case-study-teaser',
      heading: 'Case study: Sadiatec Co., Ltd.',
      body: 'A Japan–Bangladesh HR and recruitment company established in 2005. We replaced their WordPress site with a custom-built website in three languages, an admin panel their staff update themselves, an on-site chatbot that hands conversations to staff on WhatsApp, and search across every page.',
      statsStrip: 'About 20 pages · 3 languages · 11 content types · 7 integrations',
      note: 'The same engine now powers AI受付 and our clinic demo.',
      buttonLabel: 'Read the case study',
      buttonHref: '/case-studies/sadiatec',
    },
    {
      blockType: 'pricing-teaser',
      heading: 'Simple, transparent pricing.',
      packageName: 'AI受付 Starter Package',
      priceLine1: 'Initial setup from [¥300,000]',
      priceLine2: 'Monthly from [¥30,000]',
      includesList:
        'Website with AI受付 built in · Reception chat with your approved answers · Online booking · LINE booking and reminders · Japanese and English · Admin panel · Monthly support',
      note: 'Your exact quote comes after the free assessment. [Tax wording]',
      buttonLabel: 'See pricing details',
      buttonHref: '/pricing',
    },
    {
      blockType: 'security-points',
      heading: 'Safe to rely on, every day.',
      points: [
        { text: 'Answers come from information you approved.' },
        {
          text: 'Availability, prices and appointment times always come from your real booking data — never from AI.',
        },
        { text: 'A person is always one tap away.' },
        {
          text: "Personal information handled under our privacy policy and Japan's Act on the Protection of Personal Information.",
        },
        { text: 'Japanese-language support by email, phone and LINE, [weekdays 9:00–18:00].' },
      ],
      buttonLabel: 'Security and support details',
      buttonHref: '/security',
    },
    {
      blockType: 'team-grid',
      sectionHeading: 'Built by people who understand both sides.',
      intro:
        'We are a small team based in Japan. Several of us came to Japan from abroad, so we know what foreign customers need. We have also worked inside Japanese companies, so we know how Japanese businesses work.',
      bullets: [
        { text: 'One team from build to running — not a chain of vendors.' },
        {
          text: 'Built with the support of Sadiatec Co., Ltd., a Japan-based company established in 2005.',
        },
        { text: 'A working product you can try before you ever talk to us.' },
      ],
      members: [team.jamal, team.abdullah, team.haruka, team.nahida],
      partner: {
        photo: media.partnerPhoto,
        // Spec's own table gives no separate EN "name" — the EN "role"
        // column is this one combined descriptive line; JA splits name/role.
        name: 'Sadiatec Co., Ltd. — Md. Sanaul Haque, President & CEO',
        line: 'Our Japan-based partner since our first project. Chiyoda-ku, Tokyo. Established 2005.',
      },
      columns: '3',
      showBio: false,
      buttonLabel: 'Meet the team',
      buttonHref: '/about',
    },
    {
      blockType: 'cta-banner',
      heading: 'Validate your AI idea before full investment.',
      body: 'Beyond AI受付, we build small AI proofs of concept — camera inspection, voice and document AI — so you can test an idea on your own data before committing a full budget.',
      primaryButton: { label: 'Talk to us about a PoC', href: '/contact' },
    },
    {
      blockType: 'faq',
      // Spec §5.13 itself gives no heading for this homepage teaser — reusing
      // the FAQ page's own H1 (Spec §14) rather than inventing one.
      sectionHeading: 'Frequently asked questions',
      variant: 'accordion',
      // items intentionally omitted — resolved dynamically in page.tsx by
      // faqs.homepage === true, sorted by sortOrder (see G4 plan).
      textLink: { label: 'See all questions', href: '/faq' },
    },
    {
      blockType: 'cta-banner',
      heading: 'Transform your website into an AI reception desk.',
      body: 'Send us your website address. We will show you what AI受付 could handle for your business — and what your staff should keep. Free, in Japanese or English.',
      primaryButton: { label: 'Get a free AI website assessment', href: '/assessment' },
      // secondaryButton.href is injected at render from the header's resolved
      // LINE URL (resolveHeaderData) — see page.tsx's cta-banner branch.
      secondaryButton: { label: 'Ask us on LINE', href: '#', variant: 'outline' },
      textLink: { label: 'Download the brochure (PDF)', href: downloads.brochureUrl },
      showContactStrip: true,
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
    {
      blockType: 'capability-cards',
      heading: 'どの窓口から来ても、受付はひとつ。',
      intro:
        'お客様は、ホームページ、チャット、LINE、SNS、そして今後は電話からも訪れます。AI受付は、あなたが承認したひとつの情報をもとに、すべての窓口で同じように対応します。',
      cards: [
        {
          label: 'AIチャット',
          status: 'available',
          description: 'サービス内容や営業時間、アクセスなどのご質問に、承認済みの情報をもとに回答します。',
        },
        {
          label: 'AIエージェント',
          status: 'available',
          description: 'お客様を一歩ずつご案内。サービス選び、空き状況の確認、予約の完了までお手伝いします。',
        },
        {
          label: 'オンライン予約',
          status: 'available',
          description: '空き状況はリアルタイムで反映。同じ枠に2件の予約が重なることはありません。',
        },
        {
          label: 'LINE連携',
          status: 'available',
          description: '予約、確認通知、リマインド、変更・キャンセルまで、LINEの中で完結します。',
        },
        {
          label: 'SNSからの導線',
          status: 'available',
          description: 'InstagramやGoogleマップなどのリンクから、チャットや予約へ直接ご案内します。',
        },
        {
          label: 'AI電話受付',
          status: 'in-development',
          description: '承認済みの情報をもとに電話に応対する、AIの電話受付です。デモをご覧いただけます。',
        },
        {
          label: 'スタッフへの引き継ぎ',
          status: 'available',
          description: 'どの段階でも、スタッフへの連絡手段を表示。必要なときは、すぐにスタッフが対応します。',
        },
      ],
      badgeRow: '日本語・英語に対応・スタッフが更新できる管理画面・予約ごとにスタッフへ通知',
      splitHeading: 'くり返しの対応はAIに。大切な対応は、スタッフに。',
      splitLeftTitle: 'AI受付が対応すること',
      splitLeftItems: [
        { text: 'よくあるご質問' },
        { text: '営業時間' },
        { text: 'サービス内容のご案内' },
        { text: '基本的なご予約' },
        { text: 'アクセスのご案内' },
        { text: '定型的なお問い合わせ' },
        { text: 'お客様と担当スタッフの橋渡し' },
      ],
      splitRightTitle: 'スタッフが対応すること',
      splitRightItems: [
        { text: '込み入ったご相談' },
        { text: 'ご意見やご不満への対応' },
        { text: 'デリケートな内容' },
        { text: '特別なご要望' },
        { text: '大切なお客様とのやり取り' },
      ],
      splitClosingLine:
        'くり返しの受付業務はAIに任せて、スタッフはお客様と、人にしかできない仕事に集中できます。',
    },
    {
      blockType: 'live-demo',
      heading: 'まずは、体験してみてください。',
      body: 'デモは、実際に動くクリニックのホームページです。受付チャットに質問し、実際に予約して確認通知を受け取り、ご自身で変更・キャンセルまで。お客様と同じ流れを、そのまま体験いただけます。',
      checklistItems: [
        { text: '日本語・英語でサイトを見る' },
        { text: '受付チャットに質問する' },
        { text: '実際に予約する' },
        { text: '確認通知を受け取る' },
        { text: 'ご自身で変更・キャンセルする' },
      ],
      buttonLabel: 'デモを開く',
      buttonHref: demoUrl,
      qrCaption: 'スマートフォンで読み取って、お客様と同じように試せます。',
      smallPrint: 'デモに登場する[医院名]は、デモ用の架空の医院です。',
      // No JA given anywhere in the Spec for these three (brochure not in
      // this repo) — registered as G2-01.
      threeStepStrip: [{ text: '[JA TODO]' }, { text: '[JA TODO]' }, { text: '[JA TODO]' }],
      tiles: [
        {
          label: 'クリニック・治療院',
          description: '予約、初診の方からのご質問、リマインド。施術中の電話を減らします。デモあり。',
          href: '/solutions/clinic',
          buttonLabel: '活用例を見る',
        },
        {
          label: '美容サロン',
          description: 'メニューのご質問、LINE予約、次回のご予約も、施術中にしっかり受付。',
          href: '/solutions/beauty',
          buttonLabel: '活用例を見る',
        },
        {
          label: '自動車整備・販売',
          description: '車検・点検のご予約、営業時間のご案内、お見積りのご相談受付。',
          href: '/solutions/automobile',
          buttonLabel: '活用例を見る',
        },
        {
          label: 'ホテル・宿泊施設',
          description: '宿泊のお客様のご質問に、日本語・英語で24時間対応。',
          href: '/solutions/hotel',
          buttonLabel: '活用例を見る',
        },
        {
          label: '飲食店',
          description: '営業時間やメニューのご質問、お席のご予約。',
          href: '/contact',
          buttonLabel: '相談する',
        },
        {
          label: '不動産',
          description: '物件のお問い合わせ、内見のご予約、営業時間外のご質問。',
          href: '/contact',
          buttonLabel: '相談する',
        },
      ],
    },
    {
      blockType: 'tools-compatibility',
      heading: '今お使いの仕組みは、できるだけそのままに。',
      body: '多くのお店には、すでに電話番号やLINE公式アカウント、SNS、場合によっては予約システムがあります。私たちは、ゼロからやり直すのではなく、それらを活かす形で導入します。何が連携でき、何ができないかは、無料診断で具体的にお伝えします。',
      col1Title: '標準で対応',
      col1List: 'LINE公式アカウント・独自ドメイン・メール通知・GoogleマップやInstagramからのリンク',
      col2Title: '個別にご相談',
      col2List: '現在の予約システム（API連携やデータ出力に対応している場合）・外部カレンダー',
      col3Title: '連携できない場合',
      col3Body: 'AI受付の予約機能に切り替えるか、予約のたびにスタッフへすぐ通知が届くため、見落としがありません。',
      linkLabel: '連携の一覧を見る',
      linkHref: '/integrations',
    },
    {
      blockType: 'process-steps',
      heading: 'はじめてのご相談から公開まで、私たちが進めます。',
      sub: 'AIの知識は必要ありません。目安の期間：資料をお預かりしてから[X週間]。',
      steps: [
        { title: '無料診断', line: '現在のホームページと、お問い合わせの流れを確認します。' },
        { title: '設計', line: 'AI受付が答えること、スタッフが対応すること、予約の流れを一緒に決めます。' },
        { title: '構築', line: 'ホームページを構築・改修し、承認いただいた回答を登録します。' },
        { title: '連携', line: 'LINE、通知、設計で決めたツールとつなぎます。' },
        { title: 'テスト', line: '公開前に、すべての流れをお客様の立場で一緒に確認します。' },
        { title: '公開', line: '公開後も、月額サポートで運用をお手伝いします。' },
      ],
    },
    {
      blockType: 'case-study-teaser',
      heading: '導入事例：Sadiatec Co., Ltd. 様',
      body: '2005年設立、日本とバングラデシュをつなぐ人材・採用支援の会社です。WordPressのサイトを、3言語対応の独自開発サイトに刷新しました。スタッフが自分で更新できる管理画面、WhatsAppでスタッフに引き継げるチャットボット、全ページを横断する検索機能を備えています。',
      statsStrip: '約20ページ・3言語・管理項目11種類・外部連携7件',
      note: 'この事例で開発したサイト基盤が、AI受付とクリニックのデモにも使われています。',
      buttonLabel: '事例を詳しく見る',
      buttonHref: '/case-studies/sadiatec',
    },
    {
      blockType: 'pricing-teaser',
      heading: 'わかりやすく、明朗な料金。',
      packageName: 'AI受付 スタートパッケージ',
      priceLine1: '初期費用 [30万円]〜',
      priceLine2: '月額 [3万円]〜',
      includesList:
        'AI受付を組み込んだホームページ・承認済みの回答による受付チャット・オンライン予約・LINE予約とリマインド・日本語と英語・管理画面・月額サポート',
      note: '正式なお見積りは、無料診断のあとにご提示します。[税の表記]',
      buttonLabel: '料金の詳細を見る',
      buttonHref: '/pricing',
    },
    {
      blockType: 'security-points',
      heading: '毎日、安心してお使いいただくために。',
      points: [
        { text: '回答は、承認いただいた情報から。' },
        { text: '空き状況・料金・予約時間は、必ず実際の予約データから表示します。AIが作ることはありません。' },
        { text: 'いつでも、ワンタップでスタッフへ。' },
        { text: '個人情報は、個人情報保護法とプライバシーポリシーに基づいて取り扱います。' },
        { text: 'メール・電話・LINEで、日本語でサポートします（[平日 9:00〜18:00]）。' },
      ],
      buttonLabel: 'セキュリティとサポートの詳細',
      buttonHref: '/security',
    },
    {
      blockType: 'team-grid',
      sectionHeading: 'お店の立場も、お客様の立場もわかるチームです。',
      intro:
        '私たちは、日本を拠点とする少人数のチームです。メンバーの何人かは海外から日本に来て暮らしてきたため、外国人のお客様が何に困り、何を知りたいのかがわかります。また、日本企業で働いてきた経験から、日本のお店や会社の仕事の進め方も理解しています。',
      bullets: [
        { text: '構築から運用まで、ひとつのチームで。いくつもの業者を経由しません。' },
        { text: '2005年設立の日本企業、Sadiatec Co., Ltd.の協力のもとで運営しています。' },
        { text: 'ご相談の前に、実際に動く製品をお試しいただけます。' },
      ],
      members: [team.jamal, team.abdullah, team.haruka, team.nahida],
      partner: {
        photo: media.partnerPhoto,
        // Spec gives this literally bracketed — never machine-translate/edit.
        name: '[katakana from Mr. Haque]',
        role: 'パートナー企業 (partner company)',
        line: '最初のプロジェクトから私たちを支える、日本のパートナー企業です。東京都千代田区、2005年設立。',
      },
      columns: '3',
      showBio: false,
      buttonLabel: 'チームを詳しく見る',
      buttonHref: '/about',
    },
    {
      blockType: 'cta-banner',
      heading: '本格的な投資の前に、AIのアイデアを検証しませんか。',
      body: 'AI受付のほかに、画像検査・音声・文書AIなどの小さなPoC（概念実証）も開発しています。本格的な予算をかける前に、御社のデータでアイデアを検証できます。',
      primaryButton: { label: 'PoCについて相談する', href: '/contact' },
    },
    {
      blockType: 'faq',
      sectionHeading: 'よくあるご質問',
      variant: 'accordion',
      textLink: { label: 'すべての質問を見る', href: '/faq' },
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

  await updateLocalizedDoc(payload, 'pages', 'home', {
    en: { layout: enLayout },
    ja: { layout: jaLayout },
  })

  payload.logger.info('🏠 Homepage content seeded (Spec §5.1-5.14)')
}
