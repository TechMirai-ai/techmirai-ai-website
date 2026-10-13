import type { Locale, TriageOutcome, TriageResolver } from '@techmirai/reception-engine'
import { createFaqTriageResolver, FAQ_MATCH_THRESHOLD, type FaqMatchEntry } from './faq-matcher'
import { screenQuestion } from './screening'
import { MATCHED_ENTRIES, type ChatEntry } from './techmirai-chat-content'

/** Spec 16.3 F09: a symptom or legal question gets the "no advice, we hand over" answer. */
const MEDICAL_ANSWER_NODE_ID = 'f09'

/** The product name appears in most questions, so it carries no signal — removed before keyword matching. */
const BRAND_TOKEN = /ai受付/g
const ASCII_ONLY = /^[\x20-\x7e]+$/

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

interface KeywordMatcher {
  entry: ChatEntry
  test: (query: string) => number
}

/**
 * ASCII keywords match whole words only ("add" must not fire inside "address");
 * Japanese keywords match as substrings. A hit scores the keyword's length, so
 * "phone number" beats "phone"; an entry's `weight` lets a broad one (F01) lose
 * to a specific one.
 */
function buildKeywordMatchers(): KeywordMatcher[] {
  return MATCHED_ENTRIES.filter((entry) => entry.keywords).map((entry) => {
    const keywords = [...entry.keywords!.en, ...entry.keywords!.ja].map(normalize).filter(Boolean)
    const tests = keywords.map((keyword) => {
      const matches = ASCII_ONLY.test(keyword)
        ? (q: string) => new RegExp(`(?<![a-z0-9])${escapeRegExp(keyword)}(?![a-z0-9])`).test(q)
        : (q: string) => q.includes(keyword)
      return { length: keyword.length, matches }
    })
    const weight = entry.weight ?? 1
    return {
      entry,
      test: (query: string) => tests.reduce((sum, t) => (t.matches(query) ? sum + t.length * weight : sum), 0),
    }
  })
}

/** The FAQ question of each F entry, for the typo-tolerant fallback. */
function questionEntries(locale: Locale): FaqMatchEntry[] {
  return MATCHED_ENTRIES.flatMap((entry) => (entry.question ? [{ nodeId: entry.id, text: entry.question[locale] }] : []))
}

/**
 * The `TriageResolver` the TechMirai chat injects (Spec 16.3: "Matching uses the
 * keywords plus the FAQ question text"). In order:
 *
 *   1. exact FAQ question text (either language) -> that answer
 *   2. medical screen   -> F09, the Spec's own "no medical or legal advice" answer
 *   3. keywords, best score -> that answer
 *   4. fuse.js over the FAQ question text (the existing Layer-2 matcher)
 *   5. otherwise `ai`
 *
 * Pure and synchronous, like the resolver it replaces, so the hook can compute
 * the same verdict before and inside `advance`.
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

    const query = normalize(text).replace(BRAND_TOKEN, ' ')
    let bestId: string | undefined
    let bestScore = 0
    for (const { entry, test } of keywordMatchers) {
      const score = test(query)
      if (score > bestScore) {
        bestScore = score
        bestId = entry.id
      }
    }
    if (bestId) return { kind: 'static', nodeId: bestId }

    return fuzzy(text, questionLocale)
  }
}
