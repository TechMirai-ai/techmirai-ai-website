// ─────────────────────────────────────────────────────────────────────────────
// Wire contract for POST /api/reception/ai.
//
// Pure and dependency-free so the route (server) and the widget's fetch
// client (browser bundle) can share one definition of the endpoint's shape
// without either pulling in the other's dependencies.
//
// Every outcome is a 200-with-a-status except the two the caller genuinely
// got wrong (invalid body -> 400) and rate limiting (-> 429, matching the
// booking and form endpoints). "The model was unreachable" is an expected
// operating state of a free-tier dependency, not a server fault, and the
// visitor sees the same fixed copy either way.
// ─────────────────────────────────────────────────────────────────────────────

export const RECEPTION_AI_ENDPOINT = '/api/reception/ai'

/** Hard cap on an accepted question. Longer than any real reception question, short enough to bound prompt cost. */
export const MAX_QUESTION_LENGTH = 500

export type ReceptionAiStatus =
  | 'answered'
  | 'refused'
  | 'off-topic'
  | 'unavailable'
  | 'rate-limited'
  | 'invalid'

export interface ReceptionAiResponse {
  status: ReceptionAiStatus
  /** Present only when status is 'answered'. */
  answer?: string
}

export interface ReceptionAiRequest {
  question: string
  locale: 'en' | 'ja'
}

const KNOWN_STATUSES: readonly string[] = [
  'answered',
  'refused',
  'off-topic',
  'unavailable',
  'rate-limited',
  'invalid',
]

/**
 * Narrows an untrusted JSON body to the contract. Anything unrecognized —
 * including an `answered` with no usable answer string — degrades to
 * `unavailable`, which the widget renders as the fixed contact-us copy.
 */
export function parseReceptionAiResponse(json: unknown): ReceptionAiResponse {
  if (!json || typeof json !== 'object') return { status: 'unavailable' }

  const body = json as Record<string, unknown>
  const status = body['status']
  if (typeof status !== 'string' || !KNOWN_STATUSES.includes(status)) return { status: 'unavailable' }

  if (status === 'answered') {
    const answer = body['answer']
    if (typeof answer !== 'string' || answer.trim() === '') return { status: 'unavailable' }
    return { status: 'answered', answer: answer.trim() }
  }

  return { status: status as ReceptionAiStatus }
}
