import { describe, expect, it } from 'vitest'

import { renderCustomerConfirmation } from './customer-confirmation'

const baseInput = {
  patientName: '山田太郎',
  serviceName: '一般診察',
  scheduledAt: '2026-08-06T01:30:00.000Z',
  confirmationCode: 'ABC123',
  manageUrl: 'https://clinic.example/ja/booking/manage?code=ABC123&token=tok-value',
}

describe('renderCustomerConfirmation', () => {
  it('renders Japanese copy for locale "ja"', () => {
    const result = renderCustomerConfirmation({ ...baseInput, locale: 'ja' })

    expect(result.subject.length).toBeLessThanOrEqual(30)
    expect(result.html).toContain('山田太郎')
    expect(result.html).toContain('一般診察')
    expect(result.html).toContain('ABC123')
    expect(result.text).toContain('山田太郎')
    expect(result.text).toContain('ABC123')
  })

  it('renders English copy for locale "en"', () => {
    const result = renderCustomerConfirmation({ ...baseInput, locale: 'en' })

    expect(result.subject).toMatch(/confirm/i)
    expect(result.html).toContain('山田太郎')
    expect(result.text).toContain('ABC123')
  })

  it('falls back to English for an unrecognized or missing locale', () => {
    const unrecognized = renderCustomerConfirmation({ ...baseInput, locale: 'fr' })
    const missing = renderCustomerConfirmation({ ...baseInput, locale: null })

    expect(unrecognized.subject).toMatch(/confirm/i)
    expect(missing.subject).toMatch(/confirm/i)
  })

  it('HTML-escapes patient and service names', () => {
    const result = renderCustomerConfirmation({
      ...baseInput,
      locale: 'en',
      patientName: `<script>alert('x')</script>`,
    })

    expect(result.html).not.toContain('<script>')
    expect(result.html).toContain('&lt;script&gt;')
  })

  it('produces a non-empty plain-text alternative, independent of html', () => {
    const result = renderCustomerConfirmation({ ...baseInput, locale: 'ja' })

    expect(result.text.length).toBeGreaterThan(0)
    expect(result.text).not.toContain('<')
  })

  it('includes a link to manageUrl in both html and text, for either locale', () => {
    // The plain-text alternative carries the raw URL; html carries it as an
    // href attribute value, HTML-entity-escaped like any other user-supplied
    // string (the & in the query string becomes &amp;) — so we check the
    // href is present via a substring that survives escaping, not full
    // string equality against the raw URL.
    const ja = renderCustomerConfirmation({ ...baseInput, locale: 'ja' })
    expect(ja.html).toContain('href="https://clinic.example/ja/booking/manage?code=ABC123')
    expect(ja.text).toContain(baseInput.manageUrl)

    const en = renderCustomerConfirmation({ ...baseInput, locale: 'en' })
    expect(en.html).toContain('href="https://clinic.example/ja/booking/manage?code=ABC123')
    expect(en.text).toContain(baseInput.manageUrl)
  })

  it('uses reschedule-specific copy when isReschedule is true, for either locale', () => {
    const original = renderCustomerConfirmation({ ...baseInput, locale: 'en', isReschedule: false })
    const rescheduled = renderCustomerConfirmation({ ...baseInput, locale: 'en', isReschedule: true })
    expect(rescheduled.html).not.toBe(original.html)
    expect(rescheduled.subject).not.toBe(original.subject)
    expect(rescheduled.html.toLowerCase()).toContain('reschedul')
    expect(rescheduled.text.toLowerCase()).toContain('reschedul')

    const ja = renderCustomerConfirmation({ ...baseInput, locale: 'ja', isReschedule: true })
    expect(ja.subject).not.toBe(renderCustomerConfirmation({ ...baseInput, locale: 'ja' }).subject)
  })

  it('defaults to non-reschedule copy when isReschedule is omitted', () => {
    const result = renderCustomerConfirmation({ ...baseInput, locale: 'en' })
    expect(result.html.toLowerCase()).not.toContain('reschedul')
  })

  it('uses the Spec 12.4 confirmation sentence verbatim (EN)', () => {
    const result = renderCustomerConfirmation({ ...baseInput, locale: 'en' })
    expect(result.text).toContain(
      'Your 一般診察 is booked for August 6, 2026 at 10:30 (JST). We will send the meeting link by email before the call. To change or cancel, use the link in your confirmation.',
    )
  })

  it('uses the Spec 12.4 confirmation sentence verbatim (JA)', () => {
    const result = renderCustomerConfirmation({ ...baseInput, locale: 'ja' })
    expect(result.text).toContain(
      '2026年8月6日 10:30に一般診察のご予約を承りました。面談用のURLは、事前にメールでお送りします。変更・キャンセルは、確認通知内のリンクから行えます。',
    )
  })

  it('carries the literal meeting-tool placeholder by default and drops it once meetingToolConfirmed is true', () => {
    const en = renderCustomerConfirmation({ ...baseInput, locale: 'en' })
    expect(en.text).toContain('[Meeting tool — CONFIRM: Google Meet, Zoom or Teams]')
    expect(en.html).toContain('[Meeting tool — CONFIRM: Google Meet, Zoom or Teams]')
    expect(renderCustomerConfirmation({ ...baseInput, locale: 'ja' }).text).toContain('[JA TODO]')

    const confirmed = renderCustomerConfirmation({ ...baseInput, locale: 'en', meetingToolConfirmed: true })
    expect(confirmed.text).not.toContain('[Meeting tool')
    expect(confirmed.html).not.toContain('[Meeting tool')
    expect(renderCustomerConfirmation({ ...baseInput, locale: 'ja', meetingToolConfirmed: true }).text).not.toContain('[JA TODO]')
  })

  it('contains no clinic wording', () => {
    for (const locale of ['en', 'ja']) {
      const { text } = renderCustomerConfirmation({ ...baseInput, locale })
      expect(text).not.toMatch(/診療内容|初診|再診|区分|visit type|first visit/i)
    }
  })
})
