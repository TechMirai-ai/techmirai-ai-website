// ─────────────────────────────────────────────────────────────────────────────
// The FAQ content source.
//
// 36 Q&A pairs, en + ja, transcribed verbatim from FAQ-list.txt (the client's
// final content handoff — see that file at the repo root) into 5 categories.
// This is the SINGLE source of truth for all FAQ content in this app — static
// for this demo phase, deliberately not CMS-backed. It feeds three consumers:
//
//   - faq-matcher.ts: a subset of these entries (the ones with a
//     `FAQ_CONTENT_NODE_MAP` mapping) becomes the fuse.js match corpus for
//     free text.
//   - faq-answers.ts: those same six mapped nodes' displayed answer text,
//     for the flow's six button-driven `faq` nodes.
//   - ai/corpus.ts: ALL 36 entries become AI-grounding `faq` documents.
//
// The CMS path this replaced (`CLINIC_FAQ_SLUGS` / `resolveClinicFaqAnswers`
// / the live `faqs` Payload query) has been retired — see the delivery
// report for what was checked before deleting it and why the `faqs`
// collection itself (and its unrelated public /faq page) was kept.
//
// Entries 31/32/34/36 keep FAQ-list.txt's bracketed placeholders
// (e.g. "[insert opening hours]") verbatim — these are the client's own
// intentional demo placeholders, not something to fill in here. The
// wrapping `*italic*` markdown FAQ-list.txt uses around entries 31-36's
// English answers (formatting, not present in the ja text or in entries
// 01-30) is stripped; no wording is changed.
// ─────────────────────────────────────────────────────────────────────────────

export type FaqLocale = 'en' | 'ja'

/**
 * Which of the 36 entries above correspond to one of the flow graph's six
 * button-driven `faq` nodes (flow.ts: faq.hours/access/parking/prices/
 * bring/first-visit) — the shared mapping BOTH consumers of "one flow node,
 * some subset of FAQ_CONTENT" use:
 *
 *   - faq-matcher.ts: only entries listed here can ever be a `static`
 *     free-text match — a `TriageOutcome` naming any other node is refused
 *     by the engine (see faq.ask.triage's `allow` list), so an entry with
 *     no mapping here is deliberately not a matcher target. It still
 *     grounds `faq.ai` (ai/corpus.ts uses the full 36-entry set).
 *   - faq-answers.ts: builds each of the 6 buttons' own displayed answer
 *     by joining together every entry mapped to that node (see its doc
 *     comment for how ties like faq-31/faq-32 both feeding faq.hours are
 *     combined, not dropped).
 *
 * Most of the 36 entries (the appointment-booking questions, all of
 * Symptoms & Treatments / Treatment & Recovery, etc.) have no home here —
 * the six-node topology is unchanged by the FAQ content replacement; see
 * this file's module doc and the delivery report for the full reasoning.
 */
export const FAQ_CONTENT_NODE_MAP: Record<string, string> = {
  'faq-05': 'faq.first-visit',
  'faq-06': 'faq.first-visit',
  'faq-10': 'faq.bring',
  'faq-29': 'faq.parking',
  'faq-31': 'faq.hours',
  'faq-32': 'faq.hours',
  'faq-33': 'faq.access',
  'faq-34': 'faq.access',
  'faq-35': 'faq.prices',
  'faq-36': 'faq.prices',
}

export interface FaqCategory {
  id: string
  title: Record<FaqLocale, string>
}

export interface FaqContentEntry {
  /** Stable id, matching FAQ-list.txt's own numbering (faq-01 .. faq-36). */
  id: string
  category: string
  question: Record<FaqLocale, string>
  answer: Record<FaqLocale, string>
}

export const FAQ_CATEGORIES: readonly FaqCategory[] = [
  { id: 'before-visit', title: { en: 'Before Your Visit', ja: 'ご来院前に' } },
  { id: 'symptoms-treatments', title: { en: 'Symptoms & Treatments', ja: '症状・施術について' } },
  { id: 'treatment-recovery', title: { en: 'Treatment & Recovery', ja: '施術・回復について' } },
  { id: 'clinic-contact', title: { en: 'Clinic & Contact', ja: 'クリニック・お問い合わせ' } },
  { id: 'hours-access-pricing', title: { en: 'Hours, Access & Pricing', ja: '診療時間・アクセス・料金' } },
]

export const FAQ_CONTENT: readonly FaqContentEntry[] = [
  // ── Before Your Visit (01-10) ──────────────────────────────────────────
  {
    id: 'faq-01',
    category: 'before-visit',
    question: { en: 'Do I need to make an appointment before visiting?', ja: '初めて受診する場合、予約は必要ですか？' },
    answer: {
      en: 'For your first visit, we recommend making an appointment in advance so we can prepare enough time for your consultation and treatment.',
      ja: '初めての方は、スムーズにご案内するため、事前のご予約をおすすめしています。ご予約はオンライン、LINE、お電話からご利用いただけます。',
    },
  },
  {
    id: 'faq-02',
    category: 'before-visit',
    question: { en: 'Can I visit without an appointment?', ja: '予約なしでも受診できますか？' },
    answer: {
      en: 'Yes, depending on the type of treatment and clinic availability. However, making an appointment in advance can help reduce your waiting time.',
      ja: 'はい、施術内容や当日の状況によってはご予約なしでもご来院いただけます。ただし、事前にご予約いただくと待ち時間を短くできます。',
    },
  },
  {
    id: 'faq-03',
    category: 'before-visit',
    question: { en: 'How can I make an appointment?', ja: '予約はどのようにできますか？' },
    answer: {
      en: 'You can make an appointment through our online booking system or LINE. You can also contact us by phone during clinic hours.',
      ja: 'オンライン予約、LINE、お電話からご予約いただけます。診療時間内であれば、スタッフがご案内いたします。',
    },
  },
  {
    id: 'faq-04',
    category: 'before-visit',
    question: { en: 'Can I make an appointment through LINE?', ja: 'LINEから予約できますか？' },
    answer: {
      en: 'Yes. You can contact Sakura through LINE for reservations and general inquiries.',
      ja: 'はい、LINEからご予約やお問い合わせができます。お気軽にご利用ください。',
    },
  },
  {
    id: 'faq-05',
    category: 'before-visit',
    question: { en: 'What should I do if I am visiting Sakura for the first time?', ja: '初めて来院するときは、何をすればよいですか？' },
    answer: {
      en: 'Please arrive a few minutes early so we can complete the necessary information. Our staff will guide you through the consultation and treatment process.',
      ja: '初診の方は、問診などのため少し早めにお越しください。受付後、スタッフが診察から施術まで丁寧にご案内します。',
    },
  },
  {
    id: 'faq-06',
    category: 'before-visit',
    question: { en: 'How long does the first visit take?', ja: '初診にはどのくらい時間がかかりますか？' },
    answer: {
      en: 'The first visit may take a little longer because we need time to understand your concerns and assess your condition. Please allow approximately 45–60 minutes.',
      ja: '初診では、お身体の状態やお悩みを確認するため、通常の施術より少し時間がかかります。目安として45～60分程度をお考えください。',
    },
  },
  {
    id: 'faq-07',
    category: 'before-visit',
    question: { en: 'How long does a regular treatment take?', ja: '施術にはどのくらい時間がかかりますか？' },
    answer: {
      en: 'Treatment time depends on your condition and the type of care you receive. Your practitioner will explain the expected treatment time during your visit.',
      ja: '施術時間は、お身体の状態や施術内容によって異なります。詳しい時間については、来院時にスタッフがご案内します。',
    },
  },
  {
    id: 'faq-08',
    category: 'before-visit',
    question: { en: 'What should I wear for treatment?', ja: '施術を受けるときは、どのような服装がよいですか？' },
    answer: {
      en: 'Comfortable, loose-fitting clothing is recommended. Clothing that allows easy movement is ideal for most treatments.',
      ja: '動きやすく、ゆったりとした服装がおすすめです。身体を動かしやすい服装でお越しください。',
    },
  },
  {
    id: 'faq-09',
    category: 'before-visit',
    question: { en: 'Can I change clothes at the clinic?', ja: '着替えることはできますか？' },
    answer: {
      en: 'Please check with our reception team about available changing facilities. We recommend wearing comfortable clothing whenever possible.',
      ja: 'お着替えについては、来院時にスタッフへご確認ください。できるだけ動きやすい服装でのご来院をおすすめしています。',
    },
  },
  {
    id: 'faq-10',
    category: 'before-visit',
    question: { en: 'What should I bring to my first visit?', ja: '初診時に何を持っていけばよいですか？' },
    answer: {
      en: 'Please bring any necessary identification or insurance documents, along with information about any current treatments or medications if relevant.',
      ja: '必要な保険証などの書類がある場合はご持参ください。また、現在受けている治療や服用中のお薬がある場合は、分かる範囲でお知らせください。',
    },
  },

  // ── Symptoms & Treatments (11-20) ──────────────────────────────────────
  {
    id: 'faq-11',
    category: 'symptoms-treatments',
    question: { en: 'What kinds of problems can Sakura help with?', ja: 'どのような症状に対応していますか？' },
    answer: {
      en: 'We provide care for a range of concerns, including lower back pain, shoulder stiffness, neck pain, knee discomfort, muscle and joint pain, sports injuries, and movement difficulties.',
      ja: '腰痛、肩こり、首の痛み、膝の痛み、関節・筋肉の痛み、スポーツによるケガ、身体の動かしにくさなど、さまざまなお悩みに対応しています。',
    },
  },
  {
    id: 'faq-12',
    category: 'symptoms-treatments',
    question: { en: 'Can I visit for lower back pain?', ja: '腰痛でも受診できますか？' },
    answer: {
      en: 'Yes. Lower back pain is one of the common concerns we provide care for. We first assess your condition before recommending an appropriate approach.',
      ja: 'はい。腰の痛みや違和感は、よくあるご相談の一つです。まずお身体の状態を確認し、お一人おひとりに合わせた施術をご提案します。',
    },
  },
  {
    id: 'faq-13',
    category: 'symptoms-treatments',
    question: { en: 'Can you help with shoulder stiffness?', ja: '肩こりにも対応していますか？' },
    answer: {
      en: 'Yes. We can assess shoulder and upper-body discomfort and provide care based on your individual condition.',
      ja: 'はい。肩や首まわりのこりや痛みについても、お身体の状態を確認したうえで、適切な施術を行います。',
    },
  },
  {
    id: 'faq-14',
    category: 'symptoms-treatments',
    question: { en: 'Can I visit for neck pain?', ja: '首の痛みでも受診できますか？' },
    answer: {
      en: 'Yes. If you are experiencing neck pain or stiffness, we can assess your symptoms and discuss suitable care options.',
      ja: 'はい。首の痛みやこわばりなどでお悩みの方もご相談いただけます。症状を詳しくお聞きし、状態に合わせて対応します。',
    },
  },
  {
    id: 'faq-15',
    category: 'symptoms-treatments',
    question: { en: 'Do you treat knee pain?', ja: '膝の痛みも診てもらえますか？' },
    answer: {
      en: 'Yes. We provide care for various types of knee discomfort and movement difficulties. Your condition will be assessed before treatment.',
      ja: 'はい。膝の痛みや、歩く・立つ・階段の昇り降りなどで感じる不調についてもご相談いただけます。',
    },
  },
  {
    id: 'faq-16',
    category: 'symptoms-treatments',
    question: { en: 'Do you treat sports injuries?', ja: 'スポーツによるケガにも対応していますか？' },
    answer: {
      en: 'Yes. We provide support for various sports-related injuries, including strains, sprains, and movement-related discomfort.',
      ja: 'はい。捻挫や筋肉の痛みなど、スポーツによるさまざまなケガや不調に対応しています。回復と安全な運動復帰をサポートします。',
    },
  },
  {
    id: 'faq-17',
    category: 'symptoms-treatments',
    question: { en: 'Do you provide rehabilitation?', ja: 'リハビリテーションも受けられますか？' },
    answer: {
      en: 'Yes. Our rehabilitation-focused care can support mobility, strength, flexibility, and recovery following injury or physical discomfort.',
      ja: 'はい。身体の動かしやすさ、筋力、柔軟性などの回復をサポートするリハビリテーションにも対応しています。',
    },
  },
  {
    id: 'faq-18',
    category: 'symptoms-treatments',
    question: { en: 'Can you help with posture and movement problems?', ja: '姿勢や身体の動かし方についても相談できますか？' },
    answer: {
      en: 'Yes. We can assess your posture and movement patterns and provide personalized guidance to support more comfortable movement.',
      ja: 'はい。姿勢や身体の動きを確認し、お身体の状態に合わせて、より快適に動くための施術やアドバイスを行います。',
    },
  },
  {
    id: 'faq-19',
    category: 'symptoms-treatments',
    question: { en: 'Do you provide accident-related care?', ja: '交通事故などによる痛みにも対応していますか？' },
    answer: {
      en: 'Yes. Sakura provides support for accident-related pain and physical discomfort. Please contact us to discuss your situation and the appropriate next steps.',
      ja: 'はい。交通事故などによる痛みや身体の不調についてもご相談いただけます。まずは現在の症状や状況をお聞かせください。',
    },
  },
  {
    id: 'faq-20',
    category: 'symptoms-treatments',
    question: { en: "Can I visit even if I don't know what's causing my pain?", ja: '痛みの原因が分からなくても受診できますか？' },
    answer: {
      en: "Yes. You don't need to know the exact cause before visiting. Tell us what you're experiencing, and our team will assess your condition and explain the next steps.",
      ja: 'はい、大丈夫です。原因が分からない場合でも、現在感じている痛みや不調についてお聞かせください。お身体の状態を確認し、今後の対応についてご説明します。',
    },
  },

  // ── Treatment & Recovery (21-28) ───────────────────────────────────────
  {
    id: 'faq-21',
    category: 'treatment-recovery',
    question: { en: 'Will my treatment be painful?', ja: '施術は痛くありませんか？' },
    answer: {
      en: 'Our goal is to provide comfortable and appropriate care. Treatment intensity depends on your condition, and your practitioner will communicate with you throughout the process.',
      ja: 'できるだけ身体に負担の少ない、無理のない施術を心がけています。施術中も状態を確認しながら進めますので、気になることがあればいつでもお伝えください。',
    },
  },
  {
    id: 'faq-22',
    category: 'treatment-recovery',
    question: { en: 'Will I receive the same treatment every time?', ja: '毎回同じ施術を受けるのですか？' },
    answer: {
      en: 'Not necessarily. Your treatment may be adjusted depending on your current condition, progress, and individual needs.',
      ja: '必ずしも同じではありません。その日の状態や回復の経過を確認しながら、必要に応じて施術内容を調整します。',
    },
  },
  {
    id: 'faq-23',
    category: 'treatment-recovery',
    question: { en: 'How often should I visit?', ja: 'どのくらいの頻度で通えばよいですか？' },
    answer: {
      en: 'The recommended frequency depends on your condition and recovery goals. Your practitioner can discuss a suitable schedule with you.',
      ja: 'お身体の状態やお悩み、回復の目標によって異なります。施術の際に、無理のない通院ペースをご案内します。',
    },
  },
  {
    id: 'faq-24',
    category: 'treatment-recovery',
    question: { en: 'How many treatments will I need?', ja: '何回くらい通えばよくなりますか？' },
    answer: {
      en: 'Every person and condition is different, so there is no fixed number of visits. We will discuss your progress and care plan with you.',
      ja: '症状やお身体の状態は一人ひとり異なるため、必要な回数も異なります。状態や経過を確認しながら、今後の施術についてご相談します。',
    },
  },
  {
    id: 'faq-25',
    category: 'treatment-recovery',
    question: { en: 'Can I receive treatment if I am older?', ja: '高齢でも施術を受けられますか？' },
    answer: {
      en: 'Yes. We aim to provide comfortable, individualized care for people of different ages and physical conditions.',
      ja: 'はい。年齢やお身体の状態に合わせて、無理のない施術を心がけています。ご不安なことがあれば、事前にお気軽にご相談ください。',
    },
  },
  {
    id: 'faq-26',
    category: 'treatment-recovery',
    question: { en: 'Can children visit Sakura?', ja: '子どもでも受診できますか？' },
    answer: {
      en: 'Children may be able to receive certain types of care depending on their age and condition. Please contact us before visiting so we can advise you appropriately.',
      ja: '年齢や症状によって対応が異なります。お子さまの受診をご希望の場合は、ご来院前に一度お問い合わせください。',
    },
  },
  {
    id: 'faq-27',
    category: 'treatment-recovery',
    question: { en: 'Can I visit if I am pregnant?', ja: '妊娠中でも施術を受けられますか？' },
    answer: {
      en: 'Some treatments may not be appropriate during pregnancy. Please inform our staff before treatment so we can determine the safest approach for your situation.',
      ja: '妊娠中は受けられない施術もあります。妊娠中の方は、必ず施術前にスタッフへお知らせください。状態に合わせてご案内します。',
    },
  },
  {
    id: 'faq-28',
    category: 'treatment-recovery',
    question: { en: 'Can I receive treatment after surgery or an injury?', ja: '手術後やケガの後でも受診できますか？' },
    answer: {
      en: 'Treatment may be possible depending on your condition and stage of recovery. Please provide information about your injury or surgery so our practitioner can advise you appropriately.',
      ja: 'お身体の状態や回復段階によって異なります。手術やケガの内容をお伝えいただければ、受診について適切にご案内します。',
    },
  },

  // ── Clinic & Contact (29-30) ───────────────────────────────────────────
  {
    id: 'faq-29',
    category: 'clinic-contact',
    question: { en: 'Is parking available at the clinic?', ja: '駐車場はありますか？' },
    answer: {
      en: 'Parking availability depends on the clinic location. Please check our Access page or contact us for current parking information.',
      ja: '駐車場の有無や利用方法については、当院の「アクセス」ページをご確認ください。ご不明な場合は、お電話やLINEからお問い合わせください。',
    },
  },
  {
    id: 'faq-30',
    category: 'clinic-contact',
    question: { en: 'How can I contact Sakura if I have another question?', ja: 'その他の質問はどこから問い合わせできますか？' },
    answer: {
      en: 'You can contact us by phone or LINE during our available hours. Our staff will be happy to answer your questions and help you decide on the next step.',
      ja: 'ご不明な点がございましたら、お電話またはLINEからお気軽にお問い合わせください。スタッフが丁寧にご案内いたします。',
    },
  },

  // ── Hours, Access & Pricing (31-36) ────────────────────────────────────
  // Bracketed placeholders (e.g. "[insert opening hours]") are intentional —
  // preserved verbatim from FAQ-list.txt, not filled in here.
  {
    id: 'faq-31',
    category: 'hours-access-pricing',
    question: { en: 'What are your clinic hours?', ja: '診療時間を教えてください。' },
    answer: {
      en: 'Our clinic is open [insert opening hours, e.g. 9:00 AM–7:00 PM], [insert days, e.g. Monday–Saturday]. Please check our website or contact us for the most current hours.',
      ja: '当院の診療時間は、[9:00～19:00]、[月曜日～土曜日]です。最新の診療時間については、当院のウェブサイトをご確認いただくか、お電話・LINEでお問い合わせください。',
    },
  },
  {
    id: 'faq-32',
    category: 'hours-access-pricing',
    question: { en: 'Are you open on Sundays or public holidays?', ja: '日曜日や祝日も診療していますか？' },
    answer: {
      en: '[Insert: Yes/No, and any exceptions]. Please check our Access page or contact us directly to confirm hours around holidays.',
      ja: '日曜日・祝日の診療については、[休診／診療]となります。祝日前後などは診療時間が変更になる場合がありますので、ご来院前に当院のウェブサイトまたはお電話・LINEでご確認ください。',
    },
  },
  {
    id: 'faq-33',
    category: 'hours-access-pricing',
    question: { en: 'Where is Sakura Osteopathic Clinic located?', ja: 'さくら整骨院はどこにありますか？' },
    answer: {
      en: 'We are located at Sakura Building 1F, 2-14-8 Umegaoka, Setagaya-ku, Tokyo 154-0022. Please see our Access page for a map and detailed directions.',
      ja: '当院は、〒154-0022 東京都世田谷区梅丘2-14-8 さくらビル1Fにございます。詳しい場所やアクセス方法については、「アクセス」ページをご覧ください。',
    },
  },
  {
    id: 'faq-34',
    category: 'hours-access-pricing',
    question: { en: 'What is the nearest station, and how far is the walk?', ja: '最寄り駅はどこですか？駅から徒歩でどのくらいかかりますか？' },
    answer: {
      en: 'Umegaoka Station (1-31 Umegaoka, Setagaya City, Tokyo 154-0022) is the closest station. Please see our Access page for full directions.',
      ja: '最寄り駅は梅丘駅（東京都世田谷区梅丘1丁目31）です。駅から当院までの詳しい道順については、「アクセス」ページの地図をご確認ください。',
    },
  },
  {
    id: 'faq-35',
    category: 'hours-access-pricing',
    question: { en: 'How much does treatment cost?', ja: '施術料金はいくらですか？' },
    answer: {
      en: 'Treatment costs vary depending on the type of care and whether it is covered by insurance. Please contact us or ask during your visit for specific pricing.',
      ja: '料金は、施術内容や健康保険の適用有無によって異なります。詳しい料金については、「料金・保険」ページをご確認いただくか、スタッフまでお気軽にお問い合わせください。',
    },
  },
  {
    id: 'faq-36',
    category: 'hours-access-pricing',
    question: { en: 'Can I use my health insurance for treatment?', ja: '健康保険は使えますか？' },
    answer: {
      // FAQ-list.txt's own English source has a stray trailing editorial note
      // ("also add them") inside this answer, left in verbatim per the
      // "preserve exact wording, don't clean up" instruction — only its
      // surrounding whitespace is normalized. Flagged in the delivery report
      // for the content owner to confirm/remove.
      en: '[Insert: which treatments are insurance-eligible vs. self-pay, e.g. "Health insurance covers acute injuries such as bruises and sprains. Chronic-condition treatment and self-pay programs are not covered."] Please ask our staff for details specific to your situation. also add them',
      ja: '施術内容や症状によって、健康保険が適用される場合と自費となる場合があります。保険適用については、お身体の状態や施術内容を確認したうえでご案内いたします。詳しくはスタッフまでお問い合わせください。',
    },
  },
] as const
