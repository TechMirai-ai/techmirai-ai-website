// Shared Appendix B launch-scan rule checks (docs/WORK-ORDER.md Appendix B).
// Imported by both the static-source pass (scripts/preflight-check.mjs) and
// the rendered-page pass (apps/techmirai-web/scripts/launch-scan-pages.ts),
// so each rule exists in exactly one place. Zero dependencies — plain text
// matching only, so this stays importable from the zero-dependency root
// preflight script.
//
// Every check function has the shape (content, ctx) => Hit[], where:
//   content = the text to scan (source file text, or page.content()/innerText())
//   ctx     = { route, locale, filePath } — filePath for the static pass,
//             route+locale for the rendered pass. Fields the check doesn't
//             need are simply absent.
//   Hit     = { ruleId, line, snippet, note }
//
// `line` is 1-based when known (static pass); the rendered pass has no
// stable line numbers for innerText(), so it reports `line: null` and a
// snippet instead — callers merge both into one report shape.

function findHits(content, needle, ruleId, note, { caseInsensitive = false } = {}) {
  const hits = []
  const lines = content.split('\n')
  const test = caseInsensitive
    ? (line) => line.toLowerCase().includes(needle.toLowerCase())
    : (line) => line.includes(needle)
  lines.forEach((line, index) => {
    if (test(line)) {
      hits.push({ ruleId, line: index + 1, snippet: needle, note })
    }
  })
  return hits
}

function findPatternHits(content, pattern, ruleId, note) {
  const hits = []
  const lines = content.split('\n')
  lines.forEach((line, index) => {
    const matches = line.match(pattern)
    if (matches) {
      for (const match of matches) {
        hits.push({ ruleId, line: index + 1, snippet: match, note })
      }
    }
  })
  return hits
}

// --- B1: leftover template wording ------------------------------------
// docs/WORK-ORDER.md Appendix B1. "Sadiatec" is allowed only in Spec-named
// locations (homepage 5.8/5.11, About, case study, FAQ, chat answers,
// structured data) — none of those pages exist in the repo yet, so this
// stub allow-list is empty and every "Sadiatec" hit currently fails. Refine
// with real route/file patterns once Pack-3/4 builds those pages.
export const B1_LEGACY_STRINGS = [
  'Sakura Osteopathic Clinic',
  'さくら接骨院',
  'さくら整骨院',
  'sakura-sekkotsu',
  '+81-3-5432-1188',
  'clinic-demo',
  'Demo Blog Post',
  'Demo Service Brochure',
]
export const B1_LEGACY_DOMAIN_PATTERN = /[\w.-]+\.(example|invalid)\b/g
export const B1_ALLOWED_SADIATEC_LOCATIONS = [] // stub — see note above

export function checkB1LegacyWording(content, ctx = {}) {
  const hits = []
  for (const legacy of B1_LEGACY_STRINGS) {
    hits.push(...findHits(content, legacy, 'B1_LEGACY_WORDING', `leftover template content: ${JSON.stringify(legacy)}`))
  }
  hits.push(...findPatternHits(content, B1_LEGACY_DOMAIN_PATTERN, 'B1_LEGACY_WORDING', 'reserved-placeholder domain (.example/.invalid) left in published content'))

  const sadiatecHits = findHits(content, 'Sadiatec', 'B1_SADIATEC_SCOPE', 'Sadiatec named outside an Appendix-B1-approved location')
  const scope = ctx.route ?? ctx.filePath ?? ''
  const isAllowed = B1_ALLOWED_SADIATEC_LOCATIONS.some((allowed) => scope.includes(allowed))
  if (!isAllowed) hits.push(...sadiatecHits)

  return hits
}

// --- B2: old prices and discount framing --------------------------------
export const B2_OLD_PRICES = ['¥4,900', '¥19,800', '¥49,800', '¥148,000', '¥4,990,000']

export function checkB2OldPrices(content) {
  const hits = []
  for (const price of B2_OLD_PRICES) {
    hits.push(...findHits(content, price, 'B2_OLD_PRICES', `legacy price figure: ${price}`))
  }
  hits.push(...findHits(content, '90%', 'B2_OLD_PRICES', '"90%" discount wording'))
  return hits
}

// --- B3: numbers and claims ----------------------------------------------
// The named phrases are exact strings, safe to run on both the static
// source pass and the rendered-page pass. The bare "flag every % and every
// number" catch-all is intentionally NOT exported for the static pass — see
// checkB3BareNumbers below, used only by the rendered visible-text pass.
export const B3_BANNED_CLAIM_PHRASES = [
  '100% factual accuracy',
  '+20–30% bookings',
  '80% of calls handled',
  '+15% conversion',
  'sub-second response',
  'SLA guarantee',
  'never used to train third-party models',
  'lives on your infrastructure',
  'replace your receptionist',
]
const CLIENT_COUNT_PATTERN = /\b\d{1,3}(,\d{3})*\+?\s*(clients|customers|businesses served)\b/gi

export function checkB3NamedClaims(content) {
  const hits = []
  for (const phrase of B3_BANNED_CLAIM_PHRASES) {
    hits.push(...findHits(content, phrase, 'B3_NUMBERS_AND_CLAIMS', `banned claim phrase: ${JSON.stringify(phrase)}`))
  }
  hits.push(...findPatternHits(content, CLIENT_COUNT_PATTERN, 'B3_NUMBERS_AND_CLAIMS', 'client-count figure (Spec: "no client numbers anywhere")'))
  return hits
}

// Rendered visible-text pass ONLY (see apps/techmirai-web/scripts/launch-scan-pages.ts).
// Running this against raw .ts/.tsx source would flag every CSS percentage,
// numeric id, and line-height token and produce an unreadable report — the
// Spec's concern ("numbers only when facts we can prove") is about
// *published copy*, not source code.
const BARE_PERCENT_PATTERN = /\d+(\.\d+)?%/g
const BARE_NUMBER_PATTERN = /(?<![\w.])\d{2,}(?![\w%])/g // 2+ digit bare numbers, skip page/line-ish single digits

export function checkB3BareNumbers(content) {
  const hits = []
  hits.push(...findPatternHits(content, BARE_PERCENT_PATTERN, 'B3_NUMBERS_AND_CLAIMS', 'bare "%" in published copy — flag for manual Spec-number verification'))
  hits.push(...findPatternHits(content, BARE_NUMBER_PATTERN, 'B3_NUMBERS_AND_CLAIMS', 'bare number in published copy — flag for manual Spec-number verification'))
  return hits
}

// --- B4: words to avoid ---------------------------------------------------
const B4_EVERYWHERE = [
  { term: 'replace employees', lang: 'en' },
  { term: 'cut staff', lang: 'en' },
  { term: '100%', lang: 'en' },
  { term: 'perfect', lang: 'en' },
  { term: 'never wrong', lang: 'en' },
  { term: 'autonomous agent', lang: 'en' },
  { term: 'revolution', lang: 'en' },
  { term: 'disrupt', lang: 'en' },
  { term: 'No.1', lang: 'en' },
  { term: 'best in Japan', lang: 'en' },
  { term: '人員削減', lang: 'ja' },
  { term: '人件費削減', lang: 'ja' },
  { term: '100%', lang: 'ja' },
  { term: '完全', lang: 'ja' },
  { term: '絶対', lang: 'ja' },
  { term: '自律型エージェント', lang: 'ja' },
  { term: '革命', lang: 'ja' },
  { term: '破壊的', lang: 'ja' },
  { term: '業界No.1', lang: 'ja' },
]
// Spec: "homepage only. /technology may use technical terms."
const B4_HOMEPAGE_ONLY = [
  { term: 'Agentic RAG', lang: 'en' },
  { term: 'vector database', lang: 'en' },
  { term: 'LLM', lang: 'en' },
  { term: 'low-latency', lang: 'en' },
  { term: 'エージェント型RAG', lang: 'ja' },
  { term: 'ベクトルDB', lang: 'ja' },
]
const HOMEPAGE_ROUTES = new Set(['/', '/en', ''])

export function checkB4WordsToAvoid(content, ctx = {}) {
  const hits = []
  for (const { term } of B4_EVERYWHERE) {
    hits.push(...findHits(content, term, 'B4_WORDS_TO_AVOID', `words-to-avoid term used: ${JSON.stringify(term)}`))
  }
  // Conservative default: if the route isn't known (static source pass),
  // the homepage-only terms are still checked rather than silently skipped
  // — a human triages via the allow-list once the file's real page is known.
  const isHomepage = ctx.route === undefined || HOMEPAGE_ROUTES.has(ctx.route)
  if (!isHomepage) return hits
  for (const { term } of B4_HOMEPAGE_ONLY) {
    hits.push(...findHits(content, term, 'B4_WORDS_TO_AVOID', `homepage-only technical term used outside its allowed scope: ${JSON.stringify(term)}`))
  }
  return hits
}

// --- B5: glossary rules ---------------------------------------------------
// "sample"/"SME"/"escalation" are literal-term checks with no reliable way
// to detect false-positive context (e.g. "a sample size") from plain text —
// by design, hits here are expected to need human triage via the allow-list,
// same as every other launch-scan rule. The titles/schema-vs-body-copy
// "AI Reception" capitalization sub-rule is NOT automated: distinguishing
// "title/schema" from "body copy" needs DOM-position awareness this plain
// text/regex pass doesn't have — left as a documented manual-review item.
export function checkB5GlossaryRules(content) {
  const hits = []
  hits.push(...findHits(content, 'sample', 'B5_GLOSSARY_RULES', 'Spec: the demo is always "Live demo", never "sample"', { caseInsensitive: true }))
  hits.push(...findHits(content, 'available now', 'B5_GLOSSARY_RULES', 'Spec: the voice edition is never "available now"', { caseInsensitive: true }))
  hits.push(...findHits(content, 'escalation', 'B5_GLOSSARY_RULES', 'Spec: Japanese copy never uses "escalation" — use "handoff to your staff"', { caseInsensitive: true }))
  hits.push(...findHits(content, 'エスカレーション', 'B5_GLOSSARY_RULES', 'Spec: Japanese copy never uses "escalation" — use "handoff to your staff"'))
  hits.push(...findPatternHits(content, /\bSME\b/g, 'B5_GLOSSARY_RULES', 'Spec: "SME" never appears in body copy — use "small businesses"'))
  return hits
}

// --- B6: bracket placeholders ---------------------------------------------
// Spec exceptions: text inside example-chat blocks (Spec Section 7) keeps
// its brackets by design, and "[Book] [Hours]"-style button markers are
// stored as separate fields, not text. Neither the example-chat component
// nor those button fields exist in the repo yet, so no exception logic is
// implemented — every bracket currently fails. Refine once Pack-3 builds
// those components.
const BRACKET_PATTERN = /\[[^\]\n]+\]/g

// Approved launch-blocking placeholders that carry no brackets, so the
// pattern above cannot see them. Matched as exact strings. Pack-4/M1: the
// Japanese legal-page placeholder supplied by Jamal (2026-10-15); must stay
// identical to LEGAL_PLACEHOLDER.ja in apps/techmirai-web/src/lib/legal-headings.ts.
export const B6_UNBRACKETED_PLACEHOLDERS = [
  '専門家による文案作成が必要です。この文章のまま公開しないでください。',
]

export function checkB6BracketPlaceholders(content) {
  return [
    ...findPatternHits(content, BRACKET_PATTERN, 'B6_BRACKET_PLACEHOLDERS', 'bracket placeholder left in published text/config/structured data'),
    ...B6_UNBRACKETED_PLACEHOLDERS.flatMap((placeholder) =>
      findHits(content, placeholder, 'B6_BRACKET_PLACEHOLDERS', 'approved placeholder (no brackets) left in published text'),
    ),
  ]
}

// B7, images: `images` is [{ src, alt }] read from the rendered DOM (alt is null when the
// attribute is absent). An empty alt is a decorative image and is allowed. A placeholder
// image is one whose file name contains "placeholder" (the seed's naming, and the clinic
// template's /hero-placeholder.jpg), including when it arrives through Next's
// /_next/image?url=... wrapper. Inline data: URIs (the generated QR code) are skipped.
export function checkB7Images(images) {
  const hits = []
  for (const { src, alt } of images) {
    if (alt === null || alt === undefined) {
      hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: src, note: 'image missing alt attribute' })
    }
    if (src.startsWith('data:')) continue
    let decoded = src
    try {
      decoded = decodeURIComponent(src)
    } catch {
      // keep the raw value when the URL is not valid percent-encoding
    }
    if (/\/[^/?&#]*placeholder/i.test(decoded)) {
      hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: src, note: 'placeholder image published' })
    }
  }
  return hits
}

// Convenience: every check that is safe to run on raw source code (static
// pass) AND on rendered page text — i.e. everything except B3's bare-number
// catch-all and B7 (which is rendered-only/structural, implemented directly
// in launch-scan-pages.ts since it needs response/DOM access, not just text).
export function runSharedChecks(content, ctx = {}) {
  return [
    ...checkB1LegacyWording(content, ctx),
    ...checkB2OldPrices(content),
    ...checkB3NamedClaims(content),
    ...checkB4WordsToAvoid(content, ctx),
    ...checkB5GlossaryRules(content),
    ...checkB6BracketPlaceholders(content),
  ]
}
