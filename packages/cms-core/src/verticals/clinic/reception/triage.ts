import type { Locale, TriageOutcome, TriageResolver } from '@techmirai/reception-engine'
import { createClinicFaqTriageResolver, FAQ_MATCH_THRESHOLD } from './faq-matcher'
import { screenQuestion } from './screening'

/**
 * The `TriageResolver` the reception UI actually injects — the composition of
 * Part 4's screening layer with Part 3's static matcher, in that order:
 *
 *   1. `screenQuestion` says `medical`  -> `{ kind: 'refuse' }`, so the engine
 *      routes to the graph's `refusal.medical` node. This is what finally lets
 *      free text reach that node: before Part 4 the matcher never returned
 *      `refuse` at all, so only the FAQ menu's "symptoms/treatment" BUTTON
 *      could get there. The node, its fixed copy, and the `refuseTo` edge are
 *      unchanged — screening supplies the verdict, it does not do the
 *      deflecting.
 *   2. otherwise, the fuse.js matcher decides between an existing FAQ answer
 *      (`static`) and the AI fallback (`ai`), exactly as in Part 3.
 *
 * `off-topic` is deliberately NOT handled here. It is not a refusal in the
 * clinical sense and must not borrow the medical refusal's wording ("please
 * ask the practitioner directly" is nonsense in reply to "what's the
 * weather?"). It stays a routing `ai` verdict and is short-circuited with its
 * own fixed copy at the answer layer, before any LLM call — see
 * useReceptionEngine's `resolveAiText` and ai/answer.ts.
 *
 * Pure and synchronous, like the resolver it wraps: the engine stays free of
 * I/O, and the same verdict can be computed twice (once by the hook to decide
 * whether to fetch an answer, once inside `advance`) with identical results.
 */
export function createClinicTriageResolver(locale: Locale, threshold: number = FAQ_MATCH_THRESHOLD): TriageResolver {
  const matchFaq = createClinicFaqTriageResolver(locale, threshold)

  return (text: string, questionLocale: Locale): TriageOutcome => {
    if (screenQuestion(text) === 'medical') return { kind: 'refuse' }
    return matchFaq(text, questionLocale)
  }
}
