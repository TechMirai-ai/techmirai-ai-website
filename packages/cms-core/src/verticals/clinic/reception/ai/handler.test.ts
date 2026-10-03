import { describe, expect, it, vi } from 'vitest'
import type { CorpusDocument } from './corpus'
import { handleReceptionAiRequest, RECEPTION_AI_RATE_LIMIT_PREFIX } from './handler'

// The endpoint's own decisions — feature gate, rate limit, input validation,
// and the mapping of every answer status onto a response. No server, no
// database, no Groq.

const corpus: CorpusDocument[] = [
  { type: 'faq', slug: 'parking', title: '駐車場はありますか', content: '建物裏に3台分ございます。', sources: [] },
]

function groqReturning(body: unknown, status = 200) {
  const fetchImpl = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as Response)
  return { fetchImpl, groq: { apiKey: 'test-key', fetchImpl: fetchImpl as unknown as typeof fetch } }
}

const ANSWER_BODY = { choices: [{ message: { content: '現金とカードがご利用いただけます。' } }], usage: {} }

function deps(overrides: Partial<Parameters<typeof handleReceptionAiRequest>[1]> = {}) {
  return {
    enabled: true,
    checkRateLimit: vi.fn(async () => ({ success: true })),
    loadCorpus: vi.fn(async () => corpus),
    clinicName: 'さくら接骨院',
    phone: '+81-3-5432-1188',
    ...groqReturning(ANSWER_BODY),
    ...overrides,
  }
}

const validBody = { question: 'クレジットカードは使えますか', locale: 'ja' }

describe('handleReceptionAiRequest — the happy path', () => {
  it('answers 200 with the grounded answer', async () => {
    const d = deps()

    const result = await handleReceptionAiRequest({ body: validBody, ip: '1.2.3.4' }, d)

    expect(result).toEqual({ status: 200, body: { status: 'answered', answer: '現金とカードがご利用いただけます。' } })
    expect(d.loadCorpus).toHaveBeenCalledWith('ja')
  })
})

describe('handleReceptionAiRequest — rate limiting', () => {
  it('rejects with 429 and never loads the corpus or calls the model', async () => {
    const d = deps({ checkRateLimit: vi.fn(async () => ({ success: false })) })

    const result = await handleReceptionAiRequest({ body: validBody, ip: '1.2.3.4' }, d)

    expect(result).toEqual({ status: 429, body: { status: 'rate-limited' } })
    expect(d.loadCorpus).not.toHaveBeenCalled()
    expect(d.fetchImpl).not.toHaveBeenCalled()
  })

  it('uses its own namespaced bucket so it cannot eat the contact form\'s quota', async () => {
    const d = deps()

    await handleReceptionAiRequest({ body: validBody, ip: '1.2.3.4' }, d)

    expect(d.checkRateLimit).toHaveBeenCalledWith(`${RECEPTION_AI_RATE_LIMIT_PREFIX}:1.2.3.4`)
  })

  it('checks the limit before validating the body, so a flood of junk still costs the sender its quota', async () => {
    const d = deps({ checkRateLimit: vi.fn(async () => ({ success: false })) })

    const result = await handleReceptionAiRequest({ body: { nonsense: true }, ip: '1.2.3.4' }, d)

    expect(result.status).toBe(429)
  })
})

describe('handleReceptionAiRequest — input validation', () => {
  it.each([
    ['a null body (unparseable request)', null],
    ['a missing question', { locale: 'ja' }],
    ['an empty question', { question: '   ', locale: 'ja' }],
    ['an unsupported locale', { question: 'hello', locale: 'bn' }],
    ['a non-string question', { question: 42, locale: 'en' }],
    ['an over-long question', { question: 'あ'.repeat(501), locale: 'ja' }],
  ])('rejects %s with 400 and no spend', async (_label, body) => {
    const d = deps()

    const result = await handleReceptionAiRequest({ body, ip: '1.2.3.4' }, d)

    expect(result).toEqual({ status: 400, body: { status: 'invalid' } })
    expect(d.fetchImpl).not.toHaveBeenCalled()
  })
})

describe('handleReceptionAiRequest — gating and degradation', () => {
  it('answers 404 when the feature is off, before rate limiting or anything else', async () => {
    const d = deps({ enabled: false })

    const result = await handleReceptionAiRequest({ body: validBody, ip: '1.2.3.4' }, d)

    expect(result).toEqual({ status: 404, body: { status: 'unavailable' } })
    expect(d.checkRateLimit).not.toHaveBeenCalled()
  })

  it('re-screens medical questions server-side for callers that skip the widget', async () => {
    const d = deps()

    const result = await handleReceptionAiRequest(
      { body: { question: '腰が痛いのですが治りますか', locale: 'ja' }, ip: '1.2.3.4' },
      d,
    )

    expect(result).toEqual({ status: 200, body: { status: 'refused' } })
    expect(d.fetchImpl).not.toHaveBeenCalled()
  })

  it('re-screens off-topic questions server-side', async () => {
    const d = deps()

    const result = await handleReceptionAiRequest({ body: { question: '今日の天気は', locale: 'ja' }, ip: '1.2.3.4' }, d)

    expect(result).toEqual({ status: 200, body: { status: 'off-topic' } })
    expect(d.fetchImpl).not.toHaveBeenCalled()
  })

  it('returns 200 unavailable — not a 5xx — when Groq is rate-limited, and logs the reason for the operator only', async () => {
    const logError = vi.fn()
    const d = deps({ ...groqReturning({ error: 'rate limited' }, 429), logError })

    const result = await handleReceptionAiRequest({ body: validBody, ip: '1.2.3.4' }, d)

    expect(result).toEqual({ status: 200, body: { status: 'unavailable' } })
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('rate-limited'))
    expect(JSON.stringify(result.body)).not.toContain('rate-limited')
  })

  it('degrades to unavailable when the corpus cannot be loaded, without leaking the error', async () => {
    const logError = vi.fn()
    const d = deps({
      loadCorpus: vi.fn(async () => {
        throw new Error('connection to database failed at 10.0.0.5:5432')
      }),
      logError,
    })

    const result = await handleReceptionAiRequest({ body: validBody, ip: '1.2.3.4' }, d)

    expect(result).toEqual({ status: 200, body: { status: 'unavailable' } })
    expect(JSON.stringify(result.body)).not.toContain('10.0.0.5')
    expect(logError).toHaveBeenCalled()
  })
})
