import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callGroq, GROQ_API_URL, GROQ_DEFAULT_MODEL } from './groq'
import type { PromptMessage } from './prompt'

// The Groq call itself is never made in tests — `fetchImpl` is the injected
// seam. Every branch below is a failure Groq's free tier actually produces.

const messages: PromptMessage[] = [
  { role: 'system', content: 'clinic content' },
  { role: 'user', content: '駐車場はありますか' },
]

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

const OK_BODY = {
  choices: [{ message: { content: '  建物裏に3台分ございます。  ' } }],
  usage: { prompt_tokens: 1200, completion_tokens: 40 },
}

describe('callGroq — success', () => {
  it('posts to Groq with the model, messages and bearer key, and returns trimmed content', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(OK_BODY))

    const result = await callGroq(messages, { apiKey: 'test-key', fetchImpl: fetchImpl as unknown as typeof fetch })

    expect(result).toEqual({
      ok: true,
      text: '建物裏に3台分ございます。',
      usage: { promptTokens: 1200, completionTokens: 40 },
    })

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(GROQ_API_URL)
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-key')
    const body = JSON.parse(String(init.body))
    expect(body.model).toBe(GROQ_DEFAULT_MODEL)
    expect(body.messages).toEqual(messages)
    expect(body.stream).toBe(false)
    expect(body.max_tokens).toBeGreaterThan(0)
  })
})

describe('callGroq — every failure is a value, never a throw', () => {
  const originalKey = process.env['GROQ_API_KEY']

  beforeEach(() => {
    delete process.env['GROQ_API_KEY']
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env['GROQ_API_KEY']
    else process.env['GROQ_API_KEY'] = originalKey
  })

  it('reports not-configured when no API key is present, without making a request', async () => {
    const fetchImpl = vi.fn()

    const result = await callGroq(messages, { fetchImpl: fetchImpl as unknown as typeof fetch })

    expect(result).toEqual({ ok: false, reason: 'not-configured' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('reads the API key from the environment when one is not passed', async () => {
    process.env['GROQ_API_KEY'] = 'env-key'
    const fetchImpl = vi.fn(async () => jsonResponse(OK_BODY))

    const result = await callGroq(messages, { fetchImpl: fetchImpl as unknown as typeof fetch })

    expect(result.ok).toBe(true)
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer env-key')
  })

  it('reports rate-limited on 429 — the free tier\'s daily/minute cap', async () => {
    const result = await callGroq(messages, {
      apiKey: 'k',
      fetchImpl: (async () => jsonResponse({ error: 'rate limit reached' }, 429)) as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: false, reason: 'rate-limited' })
  })

  it('reports timeout when the request does not finish in time', async () => {
    // Mirrors what fetch does on abort: rejects with an AbortError.
    const fetchImpl = (async (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })) as unknown as typeof fetch

    const result = await callGroq(messages, { apiKey: 'k', fetchImpl, timeoutMs: 10 })

    expect(result).toEqual({ ok: false, reason: 'timeout' })
  })

  it('reports upstream-error on a 500', async () => {
    const result = await callGroq(messages, {
      apiKey: 'k',
      fetchImpl: (async () => jsonResponse({}, 500)) as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: false, reason: 'upstream-error' })
  })

  it('reports upstream-error when the connection fails outright', async () => {
    const result = await callGroq(messages, {
      apiKey: 'k',
      fetchImpl: (async () => {
        throw new TypeError('fetch failed')
      }) as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: false, reason: 'upstream-error' })
  })

  it('reports malformed when a 200 body is not JSON', async () => {
    const result = await callGroq(messages, {
      apiKey: 'k',
      fetchImpl: (async () =>
        ({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('Unexpected token < in JSON')
          },
        }) as unknown as Response) as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: false, reason: 'malformed' })
  })

  it.each([
    ['no choices', { usage: {} }],
    ['empty choices', { choices: [] }],
    ['non-string content', { choices: [{ message: { content: { text: 'oops' } } }] }],
    ['blank content', { choices: [{ message: { content: '   ' } }] }],
  ])('reports malformed for a 200 with %s', async (_label, body) => {
    const result = await callGroq(messages, {
      apiKey: 'k',
      fetchImpl: (async () => jsonResponse(body)) as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: false, reason: 'malformed' })
  })

  it('defaults missing usage counters to zero rather than NaN', async () => {
    const result = await callGroq(messages, {
      apiKey: 'k',
      fetchImpl: (async () => jsonResponse({ choices: [{ message: { content: 'ok' } }] })) as unknown as typeof fetch,
    })

    expect(result).toEqual({ ok: true, text: 'ok', usage: { promptTokens: 0, completionTokens: 0 } })
  })
})
