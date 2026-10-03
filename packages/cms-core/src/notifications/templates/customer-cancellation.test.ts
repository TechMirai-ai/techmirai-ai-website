import { describe, expect, it } from 'vitest'

import { renderCustomerCancellation } from './customer-cancellation'

const baseInput = {
  patientName: '山田太郎',
  serviceName: '一般診察',
  scheduledAt: '2026-08-06T01:30:00.000Z',
  visitType: 'first' as const,
  confirmationCode: 'ABC123',
}

describe('renderCustomerCancellation', () => {
  it('renders Japanese copy for locale "ja"', () => {
    const result = renderCustomerCancellation({ ...baseInput, locale: 'ja' })

    expect(result.html).toContain('山田太郎')
    expect(result.html).toContain('一般診察')
    expect(result.html).toContain('ABC123')
    expect(result.text).toContain('山田太郎')
    expect(result.text).toContain('ABC123')
  })

  it('renders English copy for locale "en"', () => {
    const result = renderCustomerCancellation({ ...baseInput, locale: 'en' })

    expect(result.subject).toMatch(/cancel/i)
    expect(result.html).toContain('山田太郎')
    expect(result.text).toContain('ABC123')
  })

  it('falls back to English for an unrecognized or missing locale', () => {
    const unrecognized = renderCustomerCancellation({ ...baseInput, locale: 'fr' })
    const missing = renderCustomerCancellation({ ...baseInput, locale: null })

    expect(unrecognized.subject).toMatch(/cancel/i)
    expect(missing.subject).toMatch(/cancel/i)
  })

  it('HTML-escapes patient and service names', () => {
    const result = renderCustomerCancellation({
      ...baseInput,
      locale: 'en',
      patientName: `<script>alert('x')</script>`,
    })

    expect(result.html).not.toContain('<script>')
    expect(result.html).toContain('&lt;script&gt;')
  })

  it('produces a non-empty plain-text alternative, independent of html', () => {
    const result = renderCustomerCancellation({ ...baseInput, locale: 'ja' })

    expect(result.text.length).toBeGreaterThan(0)
    expect(result.text).not.toContain('<')
  })
})
