import { afterEach, describe, expect, it, vi } from 'vitest'
import { RECEPTION_AI_ENDPOINT, parseReceptionAiResponse } from '../../ai-contract'
import { requestReceptionAiAnswer } from '../ai-client'

// The browser boundary. Its whole contract is "never throws, never rejects" —
// every branch below has to come back as a value the widget can render.

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(impl: () => Promise<unknown>) {
  const fetchImpl = vi.fn(impl)
  vi.stubGlobal('fetch', fetchImpl)
  return fetchImpl
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

describe('requestReceptionAiAnswer', () => {
  it('posts the question and locale to the reception endpoint', async () => {
    const fetchImpl = stubFetch(async () => jsonResponse({ status: 'answered', answer: 'Yes.' }))

    const result = await requestReceptionAiAnswer({ question: 'do you take cards?', locale: 'en' })

    expect(result).toEqual({ status: 'answered', answer: 'Yes.' })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(RECEPTION_AI_ENDPOINT)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ question: 'do you take cards?', locale: 'en' })
  })

  it('passes through a 429 as rate-limited rather than treating it as a transport failure', async () => {
    stubFetch(async () => jsonResponse({ status: 'rate-limited' }, 429))

    expect(await requestReceptionAiAnswer({ question: 'q', locale: 'en' })).toEqual({ status: 'rate-limited' })
  })

  it('degrades to unavailable when the network fails', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    expect(await requestReceptionAiAnswer({ question: 'q', locale: 'en' })).toEqual({ status: 'unavailable' })
  })

  it('degrades to unavailable when the body is not JSON', async () => {
    stubFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <')
      },
    }))

    expect(await requestReceptionAiAnswer({ question: 'q', locale: 'en' })).toEqual({ status: 'unavailable' })
  })
})

describe('parseReceptionAiResponse', () => {
  it.each([
    ['null', null],
    ['a string', 'answered'],
    ['no status', { answer: 'hello' }],
    ['an unknown status', { status: 'thinking' }],
    ['answered with no answer', { status: 'answered' }],
    ['answered with a blank answer', { status: 'answered', answer: '   ' }],
    ['answered with a non-string answer', { status: 'answered', answer: { text: 'hi' } }],
  ])('degrades %s to unavailable', (_label, body) => {
    expect(parseReceptionAiResponse(body)).toEqual({ status: 'unavailable' })
  })

  it('trims a valid answer', () => {
    expect(parseReceptionAiResponse({ status: 'answered', answer: '  hi  ' })).toEqual({ status: 'answered', answer: 'hi' })
  })

  it.each(['refused', 'off-topic', 'unavailable', 'rate-limited', 'invalid'])('passes %s through', (status) => {
    expect(parseReceptionAiResponse({ status })).toEqual({ status })
  })
})
