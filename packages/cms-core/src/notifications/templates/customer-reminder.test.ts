import { describe, expect, it } from 'vitest'

import { renderCustomerReminder } from './customer-reminder'

const baseInput = {
  patientName: '山田太郎',
  serviceName: '一般診察',
  scheduledAt: '2026-08-06T01:30:00.000Z',
  confirmationCode: 'ABC123',
}

describe('renderCustomerReminder', () => {
  it('renders Japanese copy for locale "ja" with a short subject', () => {
    const result = renderCustomerReminder({ ...baseInput, locale: 'ja' })

    expect(result.subject.length).toBeLessThanOrEqual(30)
    expect(result.html).toContain('山田太郎')
    expect(result.html).toContain('一般診察')
  })

  it('renders English copy for locale "en"', () => {
    const result = renderCustomerReminder({ ...baseInput, locale: 'en' })

    expect(result.html).toContain('山田太郎')
    expect(result.text).toContain('ABC123')
  })

  // The reminder is normally created "day before appointment", but a
  // same-day/short-notice booking can compute a scheduledFor already in the
  // past, so the cron delivers it same-day. Wording must not assume "tomorrow".
  it('never says "tomorrow" (or the ja equivalent) in subject, html, or text — same-day-safe wording', () => {
    const ja = renderCustomerReminder({ ...baseInput, locale: 'ja' })
    const en = renderCustomerReminder({ ...baseInput, locale: 'en' })

    for (const rendered of [ja, en]) {
      expect(rendered.subject.toLowerCase()).not.toContain('tomorrow')
      expect(rendered.html.toLowerCase()).not.toContain('tomorrow')
      expect(rendered.text.toLowerCase()).not.toContain('tomorrow')
    }
    expect(ja.subject).not.toContain('明日')
    expect(ja.html).not.toContain('明日')
    expect(ja.text).not.toContain('明日')
  })

  it('includes the actual rendered date/time regardless of lead time', () => {
    // Same fixture used for both a "day-before" and a same-day scenario in
    // real usage — this template only ever renders the given scheduledAt,
    // it never computes "how far away" the appointment is.
    const result = renderCustomerReminder({ ...baseInput, locale: 'en' })

    expect(result.html).toMatch(/2026/)
    expect(result.text).toMatch(/2026/)
  })

  it('uses the Spec 12.4 reminder sentence verbatim in both locales', () => {
    expect(renderCustomerReminder({ ...baseInput, locale: 'en' }).text).toContain(
      'Reminder: your 一般診察 with TechMirai is coming up on August 6, 2026 at 10:30.',
    )
    expect(renderCustomerReminder({ ...baseInput, locale: 'ja' }).text).toContain(
      'リマインド：TechMiraiとの一般診察は2026年8月6日 10:30からです。',
    )
  })

  it('HTML-escapes patient and service names', () => {
    const result = renderCustomerReminder({ ...baseInput, locale: 'en', serviceName: '<b>x</b>' })

    expect(result.html).not.toContain('<b>x</b>')
    expect(result.html).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})
