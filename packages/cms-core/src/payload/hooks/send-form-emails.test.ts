import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  confirmationHtml,
  confirmationSubject,
  makeSendFormEmailsHook,
  resolveStaffRecipient,
  staffHtml,
  staffSubject,
} from './send-form-emails'

// Pack-4/J1: focused tests for the new 'assessment' formType — the Spec
// §12.3-literal bilingual auto-reply (brackets kept literal, {name}/{url}
// substituted), the new fields surfaced in the staff email, and the
// deliberate no-fallback behavior when `assessmentRecipient` is missing
// (confirmed in plan review: skip the staff email loudly, never misdirect
// it to `contactRecipient`).

const baseConfig = {
  contactRecipient: 'reception@example.com',
  jobApplicationRecipient: 'jobs@example.com',
  seminarRecipient: 'reception@example.com',
  fromEmail: 'noreply@example.com',
}

describe('confirmationSubject — assessment', () => {
  it('returns the Spec EN subject for locale "en"', () => {
    expect(confirmationSubject('assessment', 'en')).toBe('We received your Free AI Website Assessment request')
  })

  it('returns the Spec JA subject for locale "ja"', () => {
    expect(confirmationSubject('assessment', 'ja')).toBe(
      '【TechMirai】無料AIホームページ診断のお申し込みを受け付けました',
    )
  })
})

describe('confirmationHtml — assessment', () => {
  const payload = { name: 'Taro Yamada', email: 'taro@example.com', url: 'https://example.co.jp' }

  it('substitutes {name}/{url} and keeps [TEL] and [3 business days] literal (EN)', () => {
    const html = confirmationHtml('assessment', 'Taro Yamada', 'en', payload)
    expect(html).toContain('Dear Taro Yamada,')
    expect(html).toContain('Website: https://example.co.jp')
    expect(html).toContain('[3 business days]')
    expect(html).toContain('[TEL]')
    expect(html).not.toContain('{name}')
    expect(html).not.toContain('{url}')
  })

  it('substitutes {name}/{url} and keeps [TEL] and [3営業日] literal (JA)', () => {
    const html = confirmationHtml('assessment', 'Taro Yamada', 'ja', payload)
    expect(html).toContain('Taro Yamada 様')
    expect(html).toContain('ホームページ：https://example.co.jp')
    expect(html).toContain('[3営業日]')
    expect(html).toContain('[TEL]')
  })

  it('does not affect the existing contact formType copy', () => {
    const html = confirmationHtml('contact', 'Jane')
    expect(html).toContain('Hi Jane,')
    expect(html).toContain('We have received your enquiry')
  })

  it('confirms the contact message was sent and promises no response time', () => {
    const html = confirmationHtml('contact', 'Jane')
    expect(html).toContain('sent successfully')
    expect(html).not.toMatch(/business day/i)
  })
})

describe('staffSubject/staffHtml — assessment', () => {
  const payload = {
    name: 'Taro Yamada',
    email: 'taro@example.com',
    url: 'https://example.co.jp',
    phone: '080-0000-0000',
    industry: 'beauty',
    bookingSystem: 'paper',
    lineAccount: 'yes',
    problem: ['missed-calls', 'same-questions'],
    contactPref: 'line',
  }

  it('builds a subject naming the requester', () => {
    expect(staffSubject('assessment', payload)).toBe('New Free AI Website Assessment request from Taro Yamada')
  })

  it('surfaces every new assessment field in the staff email body', () => {
    const html = staffHtml('assessment', payload, 'en')
    expect(html).toContain('https://example.co.jp')
    expect(html).toContain('080-0000-0000')
    expect(html).toContain('beauty')
    expect(html).toContain('paper')
    expect(html).toContain('yes')
    expect(html).toContain('missed-calls, same-questions')
    expect(html).toContain('line')
  })
})

describe('resolveStaffRecipient — assessment', () => {
  it('returns assessmentRecipient when configured', () => {
    expect(resolveStaffRecipient('assessment', { ...baseConfig, assessmentRecipient: 'info@techmirai-ai.com' })).toBe(
      'info@techmirai-ai.com',
    )
  })

  it('returns undefined when assessmentRecipient is missing — no fallback to contactRecipient', () => {
    expect(resolveStaffRecipient('assessment', baseConfig)).toBeUndefined()
  })

  it('still resolves contact/job-apply/seminar exactly as before', () => {
    expect(resolveStaffRecipient('contact', baseConfig)).toBe('reception@example.com')
    expect(resolveStaffRecipient('job-apply', baseConfig)).toBe('jobs@example.com')
    expect(resolveStaffRecipient('seminar', baseConfig)).toBe('reception@example.com')
  })
})

describe('makeSendFormEmailsHook — assessment dispatch behavior', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'test' }), { status: 200 }))
    vi.stubEnv('RESEND_API_KEY', 'test-key')
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  function makeDoc() {
    return {
      doc: {
        formType: 'assessment',
        email: 'taro@example.com',
        locale: 'en',
        payload: { name: 'Taro Yamada', email: 'taro@example.com', url: 'https://example.co.jp' },
      },
      operation: 'create' as const,
      // Minimal subset of the real hook args — the hook only destructures doc/operation.
    } as unknown as Parameters<ReturnType<typeof makeSendFormEmailsHook>>[0]
  }

  it('sends both staff and auto-reply emails when assessmentRecipient is configured', async () => {
    const hook = makeSendFormEmailsHook({ ...baseConfig, assessmentRecipient: 'info@techmirai-ai.com' })
    await hook(makeDoc())

    const fetchMock = vi.mocked(global.fetch)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const toAddresses = fetchMock.mock.calls.map(([, init]) => (JSON.parse(init?.body as string) as { to: string }).to)
    expect(toAddresses).toContain('info@techmirai-ai.com')
    expect(toAddresses).toContain('taro@example.com')
  })

  it('sets Reply-To to the submitter on the staff email and to staff on the auto-reply', async () => {
    const hook = makeSendFormEmailsHook({ ...baseConfig, assessmentRecipient: 'info@techmirai-ai.com' })
    await hook(makeDoc())

    const sent = vi
      .mocked(global.fetch)
      .mock.calls.map(([, init]) => JSON.parse(init?.body as string) as { to: string; replyTo: string })
    expect(sent.find((m) => m.to === 'info@techmirai-ai.com')?.replyTo).toBe('taro@example.com')
    expect(sent.find((m) => m.to === 'taro@example.com')?.replyTo).toBe('info@techmirai-ai.com')
  })

  it('skips the staff email but still sends the auto-reply when assessmentRecipient is missing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const hook = makeSendFormEmailsHook(baseConfig)
    await hook(makeDoc())

    const fetchMock = vi.mocked(global.fetch)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]!
    expect((JSON.parse(init?.body as string) as { to: string }).to).toBe('taro@example.com')
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('No staff recipient configured for formType "assessment"'))
  })

  // Serverless (Vercel) freezes the function once the request returns, so the
  // hook must not resolve until every Resend call has finished.
  it('does not resolve until both Resend calls have completed', async () => {
    let completed = 0
    global.fetch = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      completed += 1
      return new Response(JSON.stringify({ id: 'test' }), { status: 200 })
    })
    const hook = makeSendFormEmailsHook({ ...baseConfig, assessmentRecipient: 'info@techmirai-ai.com' })
    await hook(makeDoc())

    expect(completed).toBe(2)
  })

  it('still sends the auto-reply when the staff email request fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = vi.fn().mockImplementation(async (_url: unknown, init?: RequestInit) => {
      const { to } = JSON.parse(init?.body as string) as { to: string }
      if (to === 'info@techmirai-ai.com') throw new Error('network down')
      return new Response(JSON.stringify({ id: 'test' }), { status: 200 })
    })
    const hook = makeSendFormEmailsHook({ ...baseConfig, assessmentRecipient: 'info@techmirai-ai.com' })
    await expect(hook(makeDoc())).resolves.toBeDefined()

    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2)
    expect(consoleError).toHaveBeenCalled()
  })
})
