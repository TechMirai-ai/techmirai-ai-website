// ─────────────────────────────────────────────────────────────────────────────
// Request handling for POST /api/reception/ai, as a plain function.
//
// Same split as booking's `handleReserve`: everything that decides an outcome
// lives here, and the Next route is an adapter that unwraps a NextRequest and
// wraps the result in a NextResponse. That keeps the rate limit, the feature
// gate, input validation and every degraded status testable without a server.
//
// Order matters and is enforced here, not by convention at the call site:
// feature gate -> rate limit -> input validation -> screening -> corpus ->
// model. Everything that can reject a request for free happens before
// anything that costs money.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'
import { MAX_QUESTION_LENGTH, type ReceptionAiResponse } from '../ai-contract'
import { answerReceptionQuestion } from './answer'
import type { CorpusDocument } from './corpus'
import type { CallGroqOptions } from './groq'
import type { PromptLocale } from './prompt'

const requestSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
  locale: z.enum(['en', 'ja']),
})

/** Bucket prefix so this endpoint's quota is its own, not the contact form's. */
export const RECEPTION_AI_RATE_LIMIT_PREFIX = 'reception-ai'

export interface ReceptionAiHandlerDeps {
  /** False when features.aiAgent or reception.enabled is off — answers 404 before anything else. */
  enabled: boolean
  /** The app's shared limiter (5 req/60s/IP, Upstash-or-memory), keyed by this endpoint's namespace. */
  checkRateLimit: (key: string) => Promise<{ success: boolean }>
  loadCorpus: (locale: PromptLocale) => Promise<CorpusDocument[]>
  groq?: CallGroqOptions
  /** Operator-facing only. Nothing logged here is ever returned to the caller. */
  logError?: (message: string, error?: unknown) => void
}

export interface ReceptionAiHandlerInput {
  /** Already-parsed JSON body, or null if the request had none/unparseable. */
  body: unknown
  ip: string
}

export interface ReceptionAiHandlerResult {
  body: ReceptionAiResponse
  status: number
}

export async function handleReceptionAiRequest(
  { body, ip }: ReceptionAiHandlerInput,
  deps: ReceptionAiHandlerDeps,
): Promise<ReceptionAiHandlerResult> {
  if (!deps.enabled) {
    return { body: { status: 'unavailable' }, status: 404 }
  }

  const rateLimit = await deps.checkRateLimit(`${RECEPTION_AI_RATE_LIMIT_PREFIX}:${ip}`)
  if (!rateLimit.success) {
    return { body: { status: 'rate-limited' }, status: 429 }
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return { body: { status: 'invalid' }, status: 400 }
  }

  const { question, locale } = parsed.data

  try {
    const corpus = await deps.loadCorpus(locale)
    const result = await answerReceptionQuestion({
      question,
      locale,
      corpus,
      ...(deps.groq ? { groq: deps.groq } : {}),
    })

    if (result.status === 'answered') {
      return { body: { status: 'answered', answer: result.answer }, status: 200 }
    }

    if (result.status === 'unavailable') {
      // `reason` is Groq's failure, not the caller's — 'rate-limited' here is
      // the free tier's own 429, a different thing from this endpoint's
      // per-IP limit above, and must not be reported to the browser as if the
      // visitor did something wrong.
      deps.logError?.(`[reception-ai] groq unavailable: ${result.reason}`)
    }

    return { body: { status: result.status }, status: 200 }
  } catch (error) {
    // Compiling the corpus is the only remaining thing that can throw (a
    // database failure). The visitor gets the same fixed contact-us copy as
    // any other degradation, never a stack trace.
    deps.logError?.('[reception-ai] request failed', error)
    return { body: { status: 'unavailable' }, status: 200 }
  }
}
