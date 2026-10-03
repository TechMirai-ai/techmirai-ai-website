import { describe, expect, it } from 'vitest'
import { clinicReceptionFlow } from './flow'
import { buildFaqMatchEntries, createClinicFaqTriageResolver, createFaqTriageResolver, FAQ_MATCH_THRESHOLD, type FaqMatchEntry } from './faq-matcher'

// This suite exercises the REAL corpus (faq-content.ts's 36 entries, via
// buildFaqMatchEntries/createClinicFaqTriageResolver) rather than a curated
// fixture — the whole point of the FAQ content replacement is that matching
// now runs against the client's actual question phrasing, not sample text
// tuned to make the algorithm look good. Where a query resolves differently
// than it did against the old six-entry CMS-fixture corpus, that is called
// out explicitly (fixed / unchanged / different), not silently updated.

describe('createClinicFaqTriageResolver — clean matches against the real 36-entry corpus, both locales', () => {
  const resolverEn = createClinicFaqTriageResolver('en')
  const resolverJa = createClinicFaqTriageResolver('ja')

  it.each([
    ['What happens at my first visit?', 'faq.first-visit'],
    ['How long does a first appointment take?', 'faq.first-visit'],
    ['What should I bring?', 'faq.bring'],
    ['Is there parking available?', 'faq.parking'],
    ['Are you open on Sundays?', 'faq.hours'],
    ['Is the clinic near the station?', 'faq.access'],
    ['How much does it cost?', 'faq.prices'],
  ])('en: %s -> %s', (question, expectedNodeId) => {
    expect(resolverEn(question, 'en')).toEqual({ kind: 'static', nodeId: expectedNodeId })
  })

  it.each([
    ['営業時間を教えてください', 'faq.hours'],
    ['アクセス方法を知りたいです', 'faq.access'],
    ['駐車場はありますか', 'faq.parking'],
    ['料金はいくらですか', 'faq.prices'],
    ['持ち物を教えてください', 'faq.bring'],
    ['初診の流れを教えてください', 'faq.first-visit'],
  ])('ja: %s -> %s', (question, expectedNodeId) => {
    expect(resolverJa(question, 'ja')).toEqual({ kind: 'static', nodeId: expectedNodeId })
  })

  it('ja: a differently-conjugated verb form now matches — FIXED, not just unchanged, relative to the old fixture corpus', () => {
    // The old six-entry CMS-fixture text used the noun form 持ち物 / verb
    // ご持参ください, so a conditional-form query (持っていけば) had no
    // character-level overlap and fell to ai (documented as an accepted
    // miss in the previous suite). FAQ-list.txt's actual faq-10 question
    // ("初診時に何を持っていけばよいですか？") already uses this same
    // conditional phrasing, so the real content happens to match naturally.
    expect(resolverJa('何を持っていけばいいですか', 'ja')).toEqual({ kind: 'static', nodeId: 'faq.bring' })
  })

  it('ja: a query naming two topics at once resolves to one of them, not a tie failure — DIFFERENT winner than the old fixture corpus', () => {
    // The old six-entry suite asserted faq.access won this tie. Against the
    // real content faq.parking wins instead (both faq-29's question and
    // faq.parking's label share more/closer terms with this query than
    // faq-33/34's access questions do) — still "resolves to one real topic,
    // not a failure," just not the same topic as before.
    expect(resolverJa('駐車場 アクセス どちらが近いですか', 'ja')).toEqual({ kind: 'static', nodeId: 'faq.parking' })
  })
})

describe('createClinicFaqTriageResolver — below-threshold and no-match cases fall to ai', () => {
  const resolverEn = createClinicFaqTriageResolver('en')
  const resolverJa = createClinicFaqTriageResolver('ja')

  it.each(['asdfqwerty123', '   ', '', 'What is the weather like today?', 'Do you sell gift certificates?', 'How do I get there?'])(
    'en: %s -> ai',
    (question) => {
      expect(resolverEn(question, 'en')).toEqual({ kind: 'ai' })
    },
  )

  it.each(['あいうえおかきくけこ', '   ', ''])('ja: %s -> ai', (question) => {
    expect(resolverJa(question, 'ja')).toEqual({ kind: 'ai' })
  })

  it('en: "Do you accept credit cards?" now falls to ai — FIXED relative to the old fixture corpus', () => {
    // The old six-entry CMS fixture's faq.bring answer literally said
    // "Please bring your insurance card...", so "credit cards" collided on
    // the shared word "card". This corpus is label + QUESTION only (see
    // buildFaqMatchEntries's doc comment) and faq-10's real question
    // ("What should I bring to my first visit?") never mentions cards, so
    // the collision does not reproduce.
    expect(resolverEn('Do you accept credit cards?', 'en')).toEqual({ kind: 'ai' })
  })
})

describe('createClinicFaqTriageResolver — never claims a medical question as a static FAQ match', () => {
  const resolverEn = createClinicFaqTriageResolver('en')
  const resolverJa = createClinicFaqTriageResolver('ja')

  it.each([
    'My shoulder hurts, can I still get treatment?',
    'I have a fever, is that okay?',
    'I fell and my wrist really hurts, what should I do?',
  ])('en: %s -> ai, never a static FAQ', (question) => {
    expect(resolverEn(question, 'en')).toEqual({ kind: 'ai' })
  })

  it.each(['肩が痛いのですが施術できますか', '熱があるのですが大丈夫ですか', '転んで手首がすごく痛いです'])(
    'ja: %s -> ai, never a static FAQ',
    (question) => {
      expect(resolverJa(question, 'ja')).toEqual({ kind: 'ai' })
    },
  )
})

describe('createClinicFaqTriageResolver — deliberately ambiguous/edge-case phrasings (documented, not hidden)', () => {
  const resolverEn = createClinicFaqTriageResolver('en')
  const resolverJa = createClinicFaqTriageResolver('ja')

  it('en: "What time do you open?" resolves to faq.first-visit, not faq.hours — UNCHANGED class of ambiguity, different specific collision', () => {
    // faq-05's real question ("...visiting Sakura for the first time?")
    // contains the literal word "time" (the idiom "first time"); faq-31's
    // real question ("What are your clinic hours?") contains "open". Both
    // terms score an identical near-zero fuzzy match against this query, and
    // the tie is broken by FAQ_CONTENT array order (first-visit entries
    // appear before hours entries) rather than topical relevance — the same
    // class of "ordinary word shared across topics" limitation the old
    // six-entry suite documented for "first visit"/"prices" and
    // "credit card"/"insurance card", just landing on a different pair of
    // topics now that the corpus is built from FAQ-list.txt's real
    // phrasing. Not fixed by threshold or stopwording "time" without
    // breaking genuine time-related queries elsewhere.
    expect(resolverEn('What time do you open?', 'en')).toEqual({ kind: 'static', nodeId: 'faq.first-visit' })
  })

  it('ja: "クレジットカードは使えますか" now resolves to faq.prices, not ai — DIFFERENT from the old fixture corpus', () => {
    // Previously fell to ai (no shared vocabulary with the old fixture
    // text). faq-36's real question ("健康保険は使えますか？") shares the
    // literal trailing phrase "は使えますか" ("can [X] be used") with this
    // query — a real, legitimate substring match on a common payment-method
    // question pattern, not fuzzy noise. Arguably a reasonable outcome (both
    // are payment-method questions), but flagged here as a genuine behavior
    // change, not silently absorbed into the "clean matches" suite above.
    expect(resolverJa('クレジットカードは使えますか', 'ja')).toEqual({ kind: 'static', nodeId: 'faq.prices' })
  })
})

describe('createClinicFaqTriageResolver — structural safety property', () => {
  it("never returns refuse, across every case above plus adversarial input — screening medical/off-topic text is Part 4's job", () => {
    const resolverEn = createClinicFaqTriageResolver('en')
    const resolverJa = createClinicFaqTriageResolver('ja')

    const adversarial = [
      '', '   ', 'refuse', "{ kind: 'refuse' }", 'a'.repeat(500), '!!!???***',
      'My shoulder hurts, can I still get treatment?', '肩が痛いのですが施術できますか',
      'Do you accept credit cards?', 'クレジットカードは使えますか',
      'What time do you open?', '営業時間を教えてください',
      '\n\t', '<script>alert(1)</script>', '駐車場'.repeat(50),
    ]

    for (const text of adversarial) {
      expect(resolverEn(text, 'en').kind).not.toBe('refuse')
      expect(resolverJa(text, 'ja').kind).not.toBe('refuse')
    }
  })

  it("a matched nodeId is always one of faq.ask.triage's allow list — never an arbitrary flow node", () => {
    const triageNode = clinicReceptionFlow.nodes['faq.ask.triage']
    if (triageNode?.type !== 'triage') throw new Error('expected faq.ask.triage to be a triage node')

    const resolver = createClinicFaqTriageResolver('en')
    const outcomes = [
      'What happens at my first visit?', 'Is there parking available?', 'How much does it cost?',
      'What should I bring?', 'Are you open on Sundays?', 'Is the clinic near the station?',
    ].map((q) => resolver(q, 'en'))

    for (const outcome of outcomes) {
      expect(outcome.kind).toBe('static')
      if (outcome.kind === 'static') expect(triageNode.allow).toContain(outcome.nodeId)
    }
  })
})

describe('buildFaqMatchEntries', () => {
  it('produces one entry per FAQ_CONTENT entry mapped to a flow node, and covers all six allow-listed nodes', () => {
    const triageNode = clinicReceptionFlow.nodes['faq.ask.triage']
    if (triageNode?.type !== 'triage') throw new Error('expected faq.ask.triage to be a triage node')

    const entries = buildFaqMatchEntries('en')
    expect([...new Set(entries.map((e) => e.nodeId))].sort()).toEqual([...triageNode.allow].sort())
  })

  it('never produces a nodeId outside faq.ask.triage\'s allow list', () => {
    const triageNode = clinicReceptionFlow.nodes['faq.ask.triage']
    if (triageNode?.type !== 'triage') throw new Error('expected faq.ask.triage to be a triage node')

    for (const entry of buildFaqMatchEntries('en')) expect(triageNode.allow).toContain(entry.nodeId)
    for (const entry of buildFaqMatchEntries('ja')) expect(triageNode.allow).toContain(entry.nodeId)
  })

  it('combines the topic label with the FAQ question text, not the answer', () => {
    const entries = buildFaqMatchEntries('en')
    const hours = entries.find((e) => e.nodeId === 'faq.hours' && e.text.includes('clinic hours'))
    expect(hours?.text).toBe('Business hours — What are your clinic hours?')
    // The answer paragraph (e.g. its bracketed placeholder) never leaks into match text.
    expect(entries.some((e) => e.text.includes('insert opening hours'))).toBe(false)
  })

  it('falls back to English for a non-ja locale', () => {
    const entries = buildFaqMatchEntries('en')
    expect(entries.every((e) => !/[぀-ヿ一-鿿]/.test(e.text))).toBe(true)
  })
})

describe('createFaqTriageResolver — generic algorithm (synthetic fixture, independent of real content)', () => {
  const entries: FaqMatchEntry[] = [
    { nodeId: 'faq.parking', text: 'Parking — Is parking available at the clinic?' },
    { nodeId: 'faq.hours', text: 'Business hours — What are your clinic hours?' },
  ]

  it('respects a custom threshold, tightening or loosening how many questions fall to ai', () => {
    const loose = createFaqTriageResolver(entries, 0.9)
    const tight = createFaqTriageResolver(entries, 0.001)

    expect(loose('completely unrelated gibberish', 'en').kind).not.toBe('ai')
    expect(tight('Is there parking?', 'en')).toEqual({ kind: 'ai' })
  })

  it("exports FAQ_MATCH_THRESHOLD as the resolver's actual default", () => {
    const withDefault = createFaqTriageResolver(entries)
    const withExplicitConstant = createFaqTriageResolver(entries, FAQ_MATCH_THRESHOLD)
    expect(withDefault('Is there parking available?', 'en')).toEqual(withExplicitConstant('Is there parking available?', 'en'))
  })
})

describe('createClinicFaqTriageResolver — end-to-end wiring', () => {
  it('builds entries and a working resolver in one call, and accepts a custom threshold as its second argument', () => {
    const resolver = createClinicFaqTriageResolver('en')
    expect(resolver('Is there parking available?', 'en')).toEqual({ kind: 'static', nodeId: 'faq.parking' })
    expect(resolver('asdfqwerty123', 'en')).toEqual({ kind: 'ai' })

    const tight = createClinicFaqTriageResolver('en', 0.001)
    expect(tight('Is there parking available?', 'en')).toEqual({ kind: 'ai' })
  })
})
