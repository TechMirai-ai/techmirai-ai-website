'use client'

import {
  parseReceptionAiResponse,
  RECEPTION_AI_ENDPOINT,
  type ReceptionAiRequest,
  type ReceptionAiResponse,
} from '../ai-contract'

/**
 * Slightly longer than the server's own Groq timeout (GROQ_TIMEOUT_MS, 8s), so
 * a slow model normally trips the server's timer and comes back as a clean
 * `unavailable` rather than being cut off here. This is the backstop for the
 * request never returning at all.
 */
const CLIENT_TIMEOUT_MS = 12_000

export type RequestReceptionAiAnswer = (request: ReceptionAiRequest) => Promise<ReceptionAiResponse>

/**
 * Asks the server for one grounded answer. Never throws and never rejects:
 * a network failure, an abort, a non-JSON body and an unparseable body all
 * come back as `unavailable`, which the caller renders as fixed copy. The
 * visitor sees an answer or a phone number, never an error.
 */
export const requestReceptionAiAnswer: RequestReceptionAiAnswer = async ({ question, locale }) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)

  try {
    const response = await fetch(RECEPTION_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, locale }),
      signal: controller.signal,
    })

    let json: unknown
    try {
      json = await response.json()
    } catch {
      return { status: 'unavailable' }
    }

    return parseReceptionAiResponse(json)
  } catch {
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timer)
  }
}
