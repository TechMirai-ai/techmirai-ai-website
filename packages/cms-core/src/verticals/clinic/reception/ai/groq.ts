// ─────────────────────────────────────────────────────────────────────────────
// Groq chat-completions client.
//
// A direct HTTPS call over `fetch`, not an SDK: the request is one POST with
// a JSON body, and `fetchImpl` being injectable is what lets every failure
// mode below be exercised in tests without a network or a key. Deliberately
// NOT routed through /api/ai/query -> AI_AGENT_BASE_URL, which proxies to an
// external agent service that does not exist for this deployment.
//
// Every failure is a VALUE, never a thrown error: the caller has one job on
// any of them — return the fixed "please contact the clinic" copy — and a
// thrown error invites a stack trace reaching the visitor.
// ─────────────────────────────────────────────────────────────────────────────

import { MAX_ANSWER_TOKENS, type PromptMessage } from './prompt'

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const GROQ_DEFAULT_MODEL = 'openai/gpt-oss-20b'
/**
 * A visitor is watching a spinner in a chat bubble. Past this, the fixed
 * fallback copy is a better answer than a longer wait — the browser-side
 * client (ui/ai-client.ts) allows a little more than this so the server's
 * own timeout is normally the one that fires, and the caller degrades
 * identically either way.
 */
export const GROQ_TIMEOUT_MS = 8_000

/** Low but not zero: keeps phrasing natural while staying close to the content. */
const TEMPERATURE = 0.2

export type GroqFailureReason =
  /** No GROQ_API_KEY in the environment — the feature is simply not switched on. */
  | 'not-configured'
  /** Groq's free tier said 429, or the request was rejected for quota. */
  | 'rate-limited'
  /** The request did not finish inside GROQ_TIMEOUT_MS. */
  | 'timeout'
  /** Any other non-2xx, or the connection failed. */
  | 'upstream-error'
  /** 2xx whose body was not JSON, or was JSON without usable content. */
  | 'malformed'

export interface GroqUsage {
  promptTokens: number
  completionTokens: number
}

export type GroqResult =
  | { ok: true; text: string; usage: GroqUsage }
  | { ok: false; reason: GroqFailureReason }

export interface CallGroqOptions {
  /** Defaults to process.env.GROQ_API_KEY, read per call so tests and env reloads both work. */
  apiKey?: string | undefined
  model?: string | undefined
  timeoutMs?: number
  maxTokens?: number
  fetchImpl?: typeof fetch
}

interface GroqResponseShape {
  choices?: Array<{ message?: { content?: unknown } }>
  usage?: { prompt_tokens?: unknown; completion_tokens?: unknown }
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export async function callGroq(messages: PromptMessage[], options: CallGroqOptions = {}): Promise<GroqResult> {
  const apiKey = options.apiKey ?? process.env['GROQ_API_KEY']
  if (!apiKey) return { ok: false, reason: 'not-configured' }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'upstream-error' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? GROQ_TIMEOUT_MS)

  const model = options.model ?? process.env['GROQ_MODEL'] ?? GROQ_DEFAULT_MODEL
  // The gpt-oss family reasons before answering and, left uncapped, can spend
  // the whole max_tokens budget on reasoning with none left for `content` —
  // observed in practice as an intermittent 'malformed' failure. `low` keeps
  // it grounded and terse without disabling reasoning outright. The param is
  // rejected with a 400 by every non-gpt-oss model, so it is gated to those.
  const isReasoningModel = model.startsWith('openai/gpt-oss')

  let response: Response
  try {
    response = await fetchImpl(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: TEMPERATURE,
        max_tokens: options.maxTokens ?? MAX_ANSWER_TOKENS,
        stream: false,
        ...(isReasoningModel ? { reasoning_effort: 'low' } : {}),
      }),
      signal: controller.signal,
    })
  } catch (err) {
    // AbortError is the timeout above; anything else is DNS/TLS/socket.
    const aborted = err instanceof Error && err.name === 'AbortError'
    return { ok: false, reason: aborted ? 'timeout' : 'upstream-error' }
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 429) return { ok: false, reason: 'rate-limited' }
  if (!response.ok) return { ok: false, reason: 'upstream-error' }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const body = (json ?? {}) as GroqResponseShape
  const content = body.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.trim() === '') {
    return { ok: false, reason: 'malformed' }
  }

  return {
    ok: true,
    text: content.trim(),
    usage: {
      promptTokens: num(body.usage?.prompt_tokens),
      completionTokens: num(body.usage?.completion_tokens),
    },
  }
}
