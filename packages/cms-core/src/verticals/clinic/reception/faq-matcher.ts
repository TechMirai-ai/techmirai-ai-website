import Fuse from 'fuse.js'
import type { Locale, TriageOutcome, TriageResolver } from '@techmirai/reception-engine'
import { FAQ_CONTENT, FAQ_CONTENT_NODE_MAP, type FaqLocale } from './faq-content'

export interface FaqMatchEntry {
  /** A flow node id from clinicReceptionFlow's faq-type nodes — always one of
   *  faq.ask.triage's `allow` list, since both are derived from the same
   *  six nodes in the graph. */
  nodeId: string
  /** A topic label + one FAQ_CONTENT entry's question text, the searchable surface for this entry. */
  text: string
}

/**
 * Short, distinctive per-topic anchor terms, mirroring the six
 * `reception.faq.opt.*` menu-button labels in en.json/ja.json (a static
 * analog, not an import of them — this module intentionally has no i18n
 * dependency). Prepended to every match entry's text below.
 *
 * Load-bearing, not decorative: without it, two Q&A pairs from DIFFERENT
 * topics that happen to share an ordinary word (e.g. faq.first-visit's
 * answer mentioning "time" and a genuine faq.hours question about "time")
 * can score identically, and the tie is broken by iteration order rather
 * than topic relevance — confirmed empirically while building this corpus:
 * "What time do you open?" and "料金はいくらですか" both mis-routed to the
 * wrong node without this anchor. A short, topic-unique term breaks that
 * tie the right way. See faq-matcher.test.ts's "clean matches" suite.
 */
const FAQ_NODE_LABEL: Record<string, Record<FaqLocale, string>> = {
  'faq.hours': { en: 'Business hours', ja: '営業時間' },
  'faq.access': { en: 'Access / directions', ja: 'アクセス' },
  'faq.parking': { en: 'Parking', ja: '駐車場' },
  'faq.prices': { en: 'Prices', ja: '料金' },
  'faq.bring': { en: 'What to bring', ja: '持ち物' },
  'faq.first-visit': { en: 'What to expect at your first visit', ja: '初診の流れ' },
}

/**
 * Below this Fuse score (0 = perfect match, 1 = no resemblance — inverted
 * from a "confidence" reading) a hit counts as a good static match and
 * skips the AI fallback; at or above it, nothing in the mapped FAQ set
 * (see FAQ_CONTENT_NODE_MAP) resembles the question closely enough, and
 * triage falls through to `ai`.
 *
 * 0.3, not SearchBox.tsx's 0.38: SearchBox matches a short typed query
 * against short article titles — the same shape on both sides of the
 * comparison. A free-text reception question is a full sentence compared
 * against FAQ content, a different shape entirely (see the module doc
 * below), and genuine matches came back scoring 0.00–0.14 while the
 * nearest true off-topic miss scored 0.61+ in testing — 0.3 sits with
 * comfortable margin on both sides of that gap. See faq-matcher.test.ts for
 * the clean and deliberately ambiguous ja/en phrasings this was checked
 * against, including one that is NOT resolved by this margin (documented
 * there, not hidden). Iterate here, not by symptom-patching individual
 * query strings elsewhere.
 */
export const FAQ_MATCH_THRESHOLD = 0.3

/**
 * How loose Fuse's own internal search cutoff is allowed to be when
 * gathering candidates (see the comment inside createFaqTriageResolver for
 * why this is a separate, more generous value from FAQ_MATCH_THRESHOLD).
 * Wide enough that a genuine near-miss's real score is never hidden by
 * Fuse failing to find it as a candidate at all.
 */
const SEARCH_WIDE_THRESHOLD = 0.9

/**
 * Builds the match corpus from `faq-content.ts`'s 36 static entries: one
 * `FaqMatchEntry` per entry that `FAQ_CONTENT_NODE_MAP` maps to a flow node
 * (up to two entries can share a node, e.g. faq-31/faq-32 both feeding
 * `faq.hours` — the resolver below just takes the best score across all of
 * them). Entries with no mapping are excluded here, not silently dropped
 * from the product: they still ground `faq.ai` (ai/corpus.ts uses the full
 * 36-entry set), just never as a `static` menu-jump. Replaces the old
 * CMS/i18n-dependent version of this function — matching no longer needs
 * `faqAnswers` or a `TextResolver` at all, only the locale.
 *
 * Deliberately label + QUESTION only, not the answer paragraph: including
 * the answer was tried first and made matching noticeably worse. Real
 * client-authored answers are full sentences that incidentally share
 * ordinary words across unrelated topics (e.g. faq.first-visit's answer
 * mentioning "time", tying with a genuine faq.hours "what time" query) —
 * exactly the shape of collision `extractTerms`'s doc comment already warns
 * about for whole-sentence input, just appearing on the corpus side instead
 * of the query side. The question line alone is short and keyword-dense
 * (closer to the menu-button label's shape) and, empirically, matches
 * cleanly — see faq-matcher.test.ts.
 */
export function buildFaqMatchEntries(locale: Locale): FaqMatchEntry[] {
  const faqLocale: FaqLocale = locale === 'ja' ? 'ja' : 'en'
  const entries: FaqMatchEntry[] = []
  for (const content of FAQ_CONTENT) {
    const nodeId = FAQ_CONTENT_NODE_MAP[content.id]
    if (!nodeId) continue
    const label = FAQ_NODE_LABEL[nodeId]?.[faqLocale] ?? ''
    const question = content.question[faqLocale]
    const text = [label, question].filter(Boolean).join(' — ')
    if (text) entries.push({ nodeId, text })
  }
  return entries
}

// 'should', 'clinic' and 'treatment' join the list here, not at the original
// six-entry set's introduction: 'should' is generic question-phrasing
// ("What should I ...") carrying no topical signal, exactly like
// 'do'/'does'/'can' already excluded; 'clinic' and 'treatment' are this
// site's own generic nouns, present across many unrelated FAQ-list.txt
// questions (hours/access/parking all say "the clinic"; the prices
// questions say "treatment", but so would almost any free-text question
// about care). 'treatment' is safety-relevant, not just a tidiness fix:
// without it, "My shoulder hurts, can I still get treatment?" static-
// matched faq.prices on that one shared word — screening (triage.ts) still
// refuses that specific query before it reaches this matcher in production,
// but this module's own "never misroutes a medical question" property
// (see faq-matcher.test.ts) is what should hold on its own, as defense in
// depth. None of these three produced a problem against the original
// six-entry fixture text this list was first tuned against — each only
// surfaces as a same-score TIE or an unwanted match once the corpus is
// built from FAQ-list.txt's real, varied phrasing.
const EN_STOPWORDS = new Set([
  'what', 'is', 'are', 'do', 'you', 'the', 'a', 'an', 'of', 'to', 'at', 'my', 'i', 'can', 'how', 'does',
  'it', 'there', 'on', 'for', 'and', 'or', 'in', 'with', 'have', 'has', 'get', 'we', 'our', 'your', 'any',
  'should', 'clinic', 'treatment',
])
const LATIN_WORD = /[a-z0-9]+/gi
const CJK_RUN = /[぀-ヿ㐀-鿿]+/g
// A handful of single-character particles that commonly sit between two
// otherwise-unrelated words in a Japanese sentence — splitting on them turns
// a long run like "駐車場は建物裏に" into shorter, more distinctive pieces
// ("駐車場", "建物裏に") without a real morphological tokenizer.
const JA_PARTICLE_BOUNDARY = /(は|を|が|の|に|で|と|も|や|か)/
// Common polite-verb/copula endings that particle-splitting can strand as
// their own short "piece" (e.g. "…かかります" splitting into "…かかり" plus a
// bare "ます"-family fragment). These aren't distinctive to any one FAQ topic
// — nearly every Japanese sentence ends this way — so left in, they cause
// near-random cross-topic matches rather than real signal.
const JA_GRAMMAR_STOPWORDS = new Set([
  'です', 'ます', 'ました', 'ります', 'でした', 'ください', 'ございます', 'いただけます', 'かかります', 'あります',
])

/**
 * Fuse.js's fuzzy match treats its `pattern` argument (what you search FOR)
 * as the shorter of the two strings, approximately located inside the
 * (typically longer) target field — that's the SearchBox.tsx shape: a short
 * typed query against a longer title/excerpt. A reception question inverts
 * that: the QUERY is often the long, full-sentence side ("Is there parking
 * available at the clinic?"), and each FAQ's content is what should be
 * treated as short and specific. Passing the raw question straight to
 * `fuse.search()` against the FAQ text (the naive, same-shape-as-SearchBox
 * approach) was tried first and empirically failed — real full-sentence
 * questions scored 0.6–1.0 against every one of the six FAQs, indistinguishable
 * from genuinely unrelated text, because Fuse was hunting for a match of the
 * *entire sentence* inside a short paragraph.
 *
 * This inverts the comparison instead: for each FAQ entry, pull out its
 * distinctive short terms from `text` (label + FAQ question — no content is
 * invented, only re-chunked for search), then check whether each term
 * fuzzy-matches somewhere INSIDE the incoming question. That's Fuse doing
 * what it's built for on both sides of the comparison.
 */
function extractTerms(text: string): string[] {
  const terms = new Set<string>()

  for (const match of text.matchAll(LATIN_WORD)) {
    const word = match[0].toLowerCase()
    if (word.length < 3 || EN_STOPWORDS.has(word)) continue
    terms.add(word)
    // Light suffix-stripping — enough to bridge "parking" (the FAQ content's
    // wording) against "park" (a plausible way to ask about it), without a
    // real stemmer. Validated against the query set in faq-matcher.test.ts;
    // it closes that gap but is not a general-purpose stemmer, so don't
    // expect it to bridge every inflection.
    if (word.endsWith('ing') && word.length - 3 >= 3) terms.add(word.slice(0, -3))
    else if (word.endsWith('ed') && word.length - 2 >= 3) terms.add(word.slice(0, -2))
    else if (word.endsWith('s') && !word.endsWith('ss') && word.length - 1 >= 3) terms.add(word.slice(0, -1))
  }

  for (const run of text.match(CJK_RUN) ?? []) {
    for (const piece of run.split(JA_PARTICLE_BOUNDARY)) {
      if (piece.length >= 2 && !JA_PARTICLE_BOUNDARY.test(piece) && !JA_GRAMMAR_STOPWORDS.has(piece)) terms.add(piece)
    }
    if (run.length >= 2) terms.add(run)
  }

  return [...terms]
}

/**
 * Wraps fuse.js (already an app dependency, already proven for the site
 * search box) around a fixed entry set. A plain function, independent of
 * React/the reception UI, so it's testable and tunable in isolation.
 * Never returns `{ kind: 'refuse' }` — screening medical/off-topic text is
 * Part 4's job, done by a separate node ahead of this one in the graph.
 */
export function createFaqTriageResolver(entries: FaqMatchEntry[], threshold: number = FAQ_MATCH_THRESHOLD): TriageResolver {
  const termsByEntry = entries.map((entry) => ({ nodeId: entry.nodeId, terms: extractTerms(entry.text) }))

  return (text: string): TriageOutcome => {
    const query = text.trim()
    if (!query) return { kind: 'ai' }

    // A fresh single-item index per call: the "document" being searched is
    // the query itself, which is different every time — this tiny index
    // (one short string) is cheap to build at the rate questions are typed.
    //
    // Fuse's own `threshold` constructor option is NOT a post-hoc filter on
    // the score it reports — confirmed empirically: it governs the internal
    // search cutoff for whether a candidate is found at all, and a found
    // candidate's `.score` can still come back well above the configured
    // value. `SEARCH_WIDE_THRESHOLD` is deliberately generous so real
    // near-misses aren't silently dropped before we can see their score;
    // `threshold` (the confidence cutoff this function was actually called
    // with) is enforced explicitly below, on every candidate's real score.
    const queryIndex = new Fuse([{ text: query }], {
      keys: ['text'],
      threshold: SEARCH_WIDE_THRESHOLD,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true,
    })

    let bestNodeId: string | undefined
    let bestScore = Infinity
    for (const { nodeId, terms } of termsByEntry) {
      for (const term of terms) {
        const [hit] = queryIndex.search(term, { limit: 1 })
        if (hit?.score !== undefined && hit.score < bestScore) {
          bestScore = hit.score
          bestNodeId = nodeId
        }
      }
    }

    if (bestNodeId === undefined || bestScore > threshold) return { kind: 'ai' }
    return { kind: 'static', nodeId: bestNodeId }
  }
}

/** Convenience: build the corpus and wrap it in one call, for the UI hook to use directly. */
export function createClinicFaqTriageResolver(locale: Locale, threshold: number = FAQ_MATCH_THRESHOLD): TriageResolver {
  return createFaqTriageResolver(buildFaqMatchEntries(locale), threshold)
}
