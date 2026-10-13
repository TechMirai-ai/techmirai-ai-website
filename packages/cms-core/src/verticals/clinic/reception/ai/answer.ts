// ─────────────────────────────────────────────────────────────────────────────
// The one server-side entry point for answering a free-text reception
// question. Screens, prompts, calls Groq, and maps every outcome onto a small
// closed set of statuses.
//
// It returns a STATUS, not visitor-facing copy, for every outcome except a
// real grounded answer. The wording for "off topic", "ask a practitioner" and
// "we could not answer, please call" lives in the i18n messages the widget
// already resolves, so those three sentences exist once each, in ja and en,
// next to every other string the visitor reads.
// ─────────────────────────────────────────────────────────────────────────────

import { screenQuestion } from '../screening'
import type { CorpusDocument } from './corpus'
import { guardAnswer, type GuardVerdict } from './guard'
import { callGroq, type CallGroqOptions, type GroqFailureReason, type GroqUsage } from './groq'
import { buildReceptionPrompt, type PromptLocale } from './prompt'

export type ReceptionAnswerResult =
  /** A grounded answer from the model. */
  | { status: 'answered'; answer: string; usage: GroqUsage; promptTokens: number }
  /** Screened as medical — the widget normally never gets here, see below. */
  | { status: 'refused' }
  /** Screened as off-topic but not medical. No LLM call was made. */
  | { status: 'off-topic' }
  /**
   * Anything went wrong upstream, or the reply was blocked by guard.ts (an
   * unsupported price or a "Voice is available" claim). `reason` is for logs,
   * never for the visitor; a guarded reply is never returned.
   */
  | { status: 'unavailable'; reason: GroqFailureReason | Extract<GuardVerdict, { ok: false }>['reason'] }

export interface AnswerReceptionQuestionArgs {
  question: string
  locale: PromptLocale
  corpus: readonly CorpusDocument[]
  groq?: CallGroqOptions
  maxContextTokens?: number
}

/**
 * `refused` is reachable here even though the browser screens medical text
 * first and routes it to the flow's refusal node without ever calling this:
 * the endpoint is a public POST, and the screen has to hold for a caller that
 * skips the widget entirely. Same screen, same verdict, two places it can be
 * enforced.
 */
export async function answerReceptionQuestion({
  question,
  locale,
  corpus,
  groq,
  maxContextTokens,
}: AnswerReceptionQuestionArgs): Promise<ReceptionAnswerResult> {
  const screen = screenQuestion(question)
  if (screen === 'medical') return { status: 'refused' }
  if (screen === 'off-topic') return { status: 'off-topic' }

  const prompt = buildReceptionPrompt({
    question,
    locale,
    corpus,
    ...(maxContextTokens !== undefined ? { maxContextTokens } : {}),
  })

  const result = await callGroq(prompt.messages, groq ?? {})
  if (!result.ok) return { status: 'unavailable', reason: result.reason }

  // Deterministic last check (guard.ts): an unsupported price or a "Voice is
  // available" claim is dropped, never shown. The visitor gets the same fixed
  // hand-off as any other model failure.
  const verdict = guardAnswer(result.text)
  if (!verdict.ok) return { status: 'unavailable', reason: verdict.reason }

  return {
    status: 'answered',
    answer: result.text,
    usage: result.usage,
    promptTokens: prompt.estimatedTokens,
  }
}
