import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Pack-3/I3: /technology (Spec §11, lines 926-994 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Same
 * `updateLocalizedDoc` pattern as `pages/security.ts`. Every string below is
 * copied verbatim from the Spec; brackets preserved exactly per CLAUDE.md
 * rule 5.
 *
 * Hero button ("Talk to us about a PoC" → /contact) reuses the exact
 * label/href pair already seeded on the homepage's own PoC teaser
 * (`pages/home.ts`'s `cta-banner` block) — confirmed in the I3 plan review.
 *
 * "What we can test" (11.2) and "Why our websites are built differently"
 * (11.4) reuse `label-value-list` (plain label/detail pairs, no step
 * sequence or status badge — same rationale as `pages/pricing.ts`'s header
 * comment) rather than `capability-cards` (forces a 2-value status badge
 * that doesn't apply here). "Why different"'s bold lead-in phrases become
 * `label`; the rest of each sentence becomes `detail` — same split-at-the-
 * Spec's-own-boundary approach as `pages/about.ts`'s "Our promises".
 *
 * "How a PoC runs" (11.3) reuses `process-steps` with only `line` populated
 * (no per-step title in the Spec), same as `pages/how-it-works.ts`'s
 * five-step customer journey. Its "What you receive"/"Price" element table
 * is a second, unheaded `label-value-list` right after — the Spec itself
 * presents these two as plain "Element/EN/JA" rows, the exact label/detail
 * shape this block exists for.
 *
 * TRUTH CHECK for 11.5's stack table (required by this step's own prompt —
 * every row must be provable from package.json/env usage, not just copied
 * from the Spec's confident wording). Evidence gathered by reading the
 * actual repo, not assumed from the brochure:
 *   - Framework: TRUE. apps/techmirai-web/package.json: next ^15.3.9, react ^19.2.0.
 *   - CMS: TRUE. payload ^3.84.1 (same package.json).
 *   - Styling: TRUE. tailwindcss ^4.3.0.
 *   - Database: TRUE. apps/techmirai-web/payload.config.ts defaults to
 *     postgresAdapter; sqliteAdapter only runs if a sqlite `uri` override is
 *     set (a dev/test fallback, not the stated stack).
 *   - Media: TRUE, but conditional. payload.config.ts wires s3Storage to
 *     CLOUDFLARE_R2_* env vars when they're set, and falls back to local
 *     disk storage otherwise — logged in docs/FINDINGS.md so this isn't
 *     read as "always on".
 *   - Languages (i18n): TRUE. next-intl ^3.26.5; site.config.ts
 *     locales.enabled = ['ja', 'en'] — no other locale is live.
 *   - Search: TRUE. fuse.js ^7.1.0, used by
 *     src/app/(frontend)/[locale]/_components/SearchBox.tsx.
 *   - AI: the Spec's own [CONFIRM] bracket is kept verbatim per this step's
 *     instruction, even though it IS provable — GROQ_API_KEY is read by
 *     packages/cms-core/src/verticals/clinic/reception/ai/groq.ts, a real
 *     implementation, not just an env var sitting unused.
 *   - Voice: the Spec's own [CONFIRM] bracket is kept verbatim. UNLIKE AI,
 *     this one really is unproven — there is no Azure/speech code or env
 *     var anywhere in the repo; every "AI受付 Voice" reference site-wide
 *     (pricing, integrations, product-edition) says "in development".
 *     Logged in docs/FINDINGS.md: this is a bigger gap than the Spec's own
 *     "your voice stack changed recently" note implies.
 *   - Email: TRUE. resend ^6.18.1, @payloadcms/email-resend, RESEND_API_KEY.
 *   - Rate limiting: TRUE. @upstash/ratelimit, @upstash/redis,
 *     UPSTASH_REDIS_REST_* env, used by apps/techmirai-web/src/lib/rate-limit.ts
 *     (the contact-form path; the booking API's own limiter is process-local
 *     only — already flagged separately as docs/PLACEHOLDER-REGISTER.md I1-06).
 *   - Monorepo: TRUE. Root package.json: packageManager pnpm@11.1.3,
 *     devDependency turbo.
 *   - "Under the table" claims: atomic booking is TRUE (same
 *     reserve.ts finding already documented in pages/security.ts's header
 *     comment); the reception logic being a standalone package is TRUE
 *     (packages/reception-engine is its own workspace package, not folded
 *     into cms-core).
 */
export async function seedTechnologyPage(payload: Payload): Promise<void> {
  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'Validate your AI idea before full investment.',
      body: 'Have an idea for AI in your business but unsure it will work? We build a small proof of concept on your own data first, so you decide with evidence, not guesses.',
      textAlignment: 'left',
      primaryButton: { label: 'Talk to us about a PoC', href: '/contact' },
    },
    {
      blockType: 'label-value-list',
      heading: 'What we can test',
      rows: [
        {
          label: 'Camera and image AI',
          detail:
            'Object detection and anomaly detection on camera images, for example checking equipment or products on a site.',
        },
        {
          label: 'Voice AI',
          detail: 'Speech recognition and speech output in Japanese and English, including phone reception.',
        },
        {
          label: 'Document AI',
          detail: 'Search and answers over your own manuals, rules and documents.',
        },
        {
          label: 'Data automation',
          detail: 'Automating repetitive data work between databases and spreadsheets.',
        },
      ],
      footnote:
        'These areas reflect our team’s hands-on experience in Japanese research and manufacturing settings.',
    },
    {
      blockType: 'process-steps',
      heading: 'How a PoC runs',
      steps: [
        { line: 'Define the question and what “success” means, in numbers you choose.' },
        { line: 'Check your data: is there enough, and is it usable?' },
        // PLACEHOLDER-OFF: { line: 'Build a small working prototype in [X weeks].' },
        { line: 'Report honestly: what worked, what did not, and what going further would cost.' },
        { line: 'You decide: continue, change direction, or stop — with no obligation.' },
      ],
    },
    {
      blockType: 'label-value-list',
      rows: [
        {
          label: 'What you receive',
          detail:
            'A working prototype · A results report · A go / no-go recommendation · An estimate for production',
        },
        { label: 'Price', detail: 'Quote on request, after a free first conversation.' },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'Why our websites are built differently',
      rows: [
        { label: 'Custom-built, not a template.', detail: 'Every site runs on our own engine.' },
        { label: 'Your staff update it themselves.', detail: 'An admin panel with separate staff permissions.' },
        { label: 'Booking without double bookings.', detail: 'Two customers can never take the same slot.' },
        {
          label: 'One admin panel, several languages.',
          detail: 'Japanese and English edited side by side.',
        },
        {
          label: 'One engine, many sites.',
          detail: 'Improvements to the shared engine can reach every client site.',
        },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: 'For technical teams',
      rows: [
        { label: 'Framework', detail: 'Next.js 15 · React 19' },
        { label: 'CMS', detail: 'Payload CMS v3' },
        { label: 'Styling', detail: 'Tailwind CSS 4' },
        { label: 'Database', detail: 'PostgreSQL' },
        { label: 'Media', detail: 'Cloudflare R2' },
        { label: 'Languages (i18n)', detail: 'next-intl · ja / en' },
        { label: 'Search', detail: 'Fuse.js' },
        // PLACEHOLDER-OFF: rows 'AI' / 'Voice' (bracketed, unconfirmed)
        // { label: 'AI', detail: '[Groq — CONFIRM]' },
        // { label: 'Voice', detail: '[Azure AI Speech — CONFIRM]' },
        { label: 'Email', detail: 'Resend' },
        { label: 'Rate limiting', detail: 'Upstash Redis' },
        { label: 'Monorepo', detail: 'pnpm · Turborepo' },
      ],
      footnote:
        'A shared engine rather than copied templates. Atomic booking, so two customers cannot take the same slot. The reception logic is a standalone package.',
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: '本格的な投資の前に、AIのアイデアを検証する。',
      body: '「AIで、こんなことができないか」というアイデアはあっても、本当にうまくいくかわからない。そんなときは、まず御社のデータで小さなPoC（概念実証）をつくり、根拠をもって判断できるようにします。',
      textAlignment: 'left',
      primaryButton: { label: 'PoCについて相談する', href: '/contact' },
    },
    {
      blockType: 'label-value-list',
      heading: '検証できること',
      rows: [
        {
          label: '画像AI',
          detail: 'カメラ映像からの物体検出や異常検知。たとえば、現場の設備や製品の確認など。',
        },
        {
          label: '音声AI',
          detail: '日本語・英語の音声認識と音声合成。電話受付への活用も含みます。',
        },
        {
          label: '文書AI',
          detail: '社内のマニュアルや規程、文書を対象にした検索と回答。',
        },
        {
          label: 'データ業務の自動化',
          detail: 'データベースや表計算ソフト間のくり返し作業の自動化。',
        },
      ],
      footnote: 'これらは、日本の研究開発や製造の現場で、私たちのメンバーが実際に携わってきた分野です。',
    },
    {
      blockType: 'process-steps',
      heading: 'PoCの進め方',
      steps: [
        { line: '検証したい問いと、「成功」の基準を、御社が決めた数字で定めます。' },
        { line: 'データを確認します。量は足りるか、使える状態か。' },
        // PLACEHOLDER-OFF: { line: '[X週間]で、小さく動く試作品をつくります。' },
        { line: 'うまくいったこと、いかなかったこと、本格導入にかかる費用を、正直にご報告します。' },
        { line: '続ける、方向を変える、やめる。判断は御社が自由に行えます。' },
      ],
    },
    {
      blockType: 'label-value-list',
      rows: [
        {
          label: 'お渡しするもの',
          detail: '動く試作品・検証結果のレポート・進めるべきかどうかのご提案・本格導入のお見積り',
        },
        { label: '価格', detail: '初回のご相談は無料。その後にお見積りします。' },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: '私たちのホームページがテンプレートと違う理由',
      rows: [
        { label: 'テンプレートではなく、独自開発。', detail: 'すべてのサイトを自社開発の基盤で構築しています。' },
        { label: 'スタッフが自分で更新。', detail: '権限を分けた管理画面を備えています。' },
        { label: '予約の重複が起きない。', detail: '同じ枠に2件の予約が入ることはありません。' },
        { label: 'ひとつの管理画面で、多言語を。', detail: '日本語と英語を並べて編集できます。' },
        { label: 'ひとつの基盤を、多くのサイトで。', detail: '共通基盤の改善を、各サイトに反映できます。' },
      ],
    },
    {
      blockType: 'label-value-list',
      heading: '技術担当者向け情報',
      rows: [
        { label: 'フレームワーク', detail: 'Next.js 15 · React 19' },
        { label: 'CMS', detail: 'Payload CMS v3' },
        { label: 'スタイリング', detail: 'Tailwind CSS 4' },
        { label: 'データベース', detail: 'PostgreSQL' },
        { label: 'メディア', detail: 'Cloudflare R2' },
        { label: '多言語対応 (i18n)', detail: 'next-intl · ja / en' },
        { label: '検索', detail: 'Fuse.js' },
        // PLACEHOLDER-OFF: rows AI / 音声 (bracketed, unconfirmed)
        // { label: 'AI', detail: '[Groq — 確認中]' },
        // { label: '音声', detail: '[Azure AI Speech — 確認中]' },
        { label: 'メール', detail: 'Resend' },
        { label: '送信回数制限', detail: 'Upstash Redis' },
        { label: 'モノレポ', detail: 'pnpm · Turborepo' },
      ],
      footnote:
        'テンプレートの複製ではなく、共通の基盤を使っています。予約は排他制御により、同じ枠の重複を防ぎます。受付のロジックは独立したパッケージとして構成しています。',
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'technology', { en: { layout: enLayout }, ja: { layout: jaLayout } })

  payload.logger.info('🔧 /technology content seeded (Spec §11)')
}
