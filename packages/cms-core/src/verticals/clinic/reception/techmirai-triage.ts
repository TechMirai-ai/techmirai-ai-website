import type { Locale, TriageOutcome, TriageResolver } from '@techmirai/reception-engine'
import { createFaqTriageResolver, FAQ_MATCH_THRESHOLD, type FaqMatchEntry } from './faq-matcher'
import { screenQuestion } from './screening'
import { KEYWORDED_ENTRIES, MATCHED_ENTRIES, OFF_TOPIC_NODE_ID, type ChatEntry } from './techmirai-chat-content'

/** Spec 16.3 F09: a symptom or legal question gets the "no advice, we hand over" answer. */
const MEDICAL_ANSWER_NODE_ID = 'f09'

/**
 * The product name appears in most questions, so it carries no signal — removed
 * before keyword matching.
 */
const BRAND_TOKEN = /ai受付/g
const ASCII_ONLY = /^[\x20-\x7e]+$/

/**
 * Words dropped from the FAQ question text before it is indexed for fuzzy
 * matching (never from what the visitor types, and never from the answers).
 * "demo" is the only one: it is why "Do you have a restaurant demo?" (Spec
 * §16.7 row 14) matched F26, "Is the demo clinic real?", on a single shared
 * word and never reached the AI. Without it, F26 is still reached by its exact
 * question, by its keywords, and by "real" in a question such as "Is the demo
 * real?".
 *
 * "when" is the second: it is why "When can you start next month?" (row 10)
 * matched F10, "What happens when AI受付 cannot answer?", on that one word
 * instead of reaching the AI. F10 is still reached by its exact question, its
 * keywords (cannot, don't know) and its other words.
 */
const GENERIC_TOPIC_WORDS = /\b(?:demo|when)\b|デモ/gi

function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .trim()
}

/** A question with its trailing punctuation dropped, so "How much does it cost" equals the FAQ's own wording. */
function comparable(text: string): string {
  return normalize(text).replace(/[\s?？!！。.]+$/u, '')
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** ASCII keywords match as whole words ("add" must not fire inside "address"); Japanese keywords as substrings. */
function keywordMatcher(keyword: string): (query: string) => boolean {
  return ASCII_ONLY.test(keyword)
    ? (q) => new RegExp(`(?<![a-z0-9])${escapeRegExp(keyword)}(?![a-z0-9])`).test(q)
    : (q) => q.includes(keyword)
}

interface KeywordMatcher {
  entry: ChatEntry
  test: (query: string) => number
}

/**
 * A hit scores the keyword's length, so "phone number" beats "phone"; an entry's
 * `weight` lets a broad one (F01, F04) lose to a specific one.
 */
function buildKeywordMatchers(): KeywordMatcher[] {
  return KEYWORDED_ENTRIES.filter((entry) => entry.keywords).map((entry) => {
    const keywords = [...entry.keywords!.en, ...entry.keywords!.ja].map(normalize).filter(Boolean)
    const tests = keywords.map((keyword) => ({ length: keyword.length, matches: keywordMatcher(keyword) }))
    const weight = entry.weight ?? 1
    return {
      entry,
      test: (query) => tests.reduce((sum, t) => (t.matches(query) ? sum + t.length * weight : sum), 0),
    }
  })
}

function bestKeywordMatch(matchers: KeywordMatcher[], query: string): string | undefined {
  let bestId: string | undefined
  let bestScore = 0
  for (const { entry, test } of matchers) {
    const score = test(query)
    if (score > bestScore) {
      bestScore = score
      bestId = entry.id
    }
  }
  return bestId
}

/** The FAQ question of each F entry, minus the generic topic words, for the existing fuse.js matcher. */
function questionEntries(locale: Locale): FaqMatchEntry[] {
  return MATCHED_ENTRIES.flatMap((entry) =>
    entry.question
      ? [{ nodeId: entry.id, text: entry.question[locale].replace(GENERIC_TOPIC_WORDS, ' ').replace(/\s+/g, ' ').trim() }]
      : [],
  )
}

/**
 * The `TriageResolver` the TechMirai chat injects (Spec 16.3: "Matching uses the
 * keywords plus the FAQ question text"). In order:
 *
 *   1. exact FAQ question text (either language)  -> that answer
 *   2. medical screen                             -> F09, the Spec's "no medical or legal advice"
 *   3. keywords, best score (incl. "talk to a person" -> B6) -> that answer
 *   4. off-topic screen                           -> the rule-13 redirect (a labelled placeholder)
 *   5. fuse.js over the FAQ question text         -> that answer (the existing Layer-2 matcher)
 *   6. otherwise `ai`
 *
 * Keywords come before the off-topic screen so "Are you an AI?" is F08, not a
 * meta-question deflection. Pure and synchronous, so the hook can compute the
 * same verdict before and inside `advance`.
 */
export function createTechmiraiTriageResolver(locale: Locale, threshold: number = FAQ_MATCH_THRESHOLD): TriageResolver {
  const keywordMatchers = buildKeywordMatchers()
  const fuzzy = createFaqTriageResolver(questionEntries(locale), threshold)
  const exact = new Map<string, string>()
  for (const entry of MATCHED_ENTRIES) {
    if (!entry.question) continue
    exact.set(comparable(entry.question.en), entry.id)
    exact.set(comparable(entry.question.ja), entry.id)
  }

  return (text: string, questionLocale: Locale): TriageOutcome => {
    if (!text.trim()) return { kind: 'ai' }

    // A curated FAQ question is never reinterpreted by the heuristic screen.
    const exactId = exact.get(comparable(text))
    if (exactId) return { kind: 'static', nodeId: exactId }

    if (screenQuestion(text) === 'medical') return { kind: 'static', nodeId: MEDICAL_ANSWER_NODE_ID }

    const keywordId = bestKeywordMatch(keywordMatchers, normalize(text).replace(BRAND_TOKEN, ' '))
    if (keywordId) return { kind: 'static', nodeId: keywordId }

    if (screenQuestion(text) === 'off-topic') return { kind: 'static', nodeId: OFF_TOPIC_NODE_ID }

    return fuzzy(text, questionLocale)
  }
}
