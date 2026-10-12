import { describe, expect, it } from 'vitest'

import { escapeHtml, formatDate, formatDateTime, formatTime, resolveLocale } from './shared'

describe('resolveLocale', () => {
  it('selects ja for locale "ja"', () => {
    expect(resolveLocale('ja')).toBe('ja')
  })

  it('falls back to en for "en"', () => {
    expect(resolveLocale('en')).toBe('en')
  })

  it('falls back to en for an unrecognized locale', () => {
    expect(resolveLocale('fr')).toBe('en')
  })

  it('falls back to en for null/undefined/empty', () => {
    expect(resolveLocale(null)).toBe('en')
    expect(resolveLocale(undefined)).toBe('en')
    expect(resolveLocale('')).toBe('en')
  })
})

describe('escapeHtml', () => {
  it('escapes HTML-significant characters in user-supplied text', () => {
    expect(escapeHtml(`<script>alert('x')</script> & "quotes"`)).toBe(
      '&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; &quot;quotes&quot;',
    )
  })

  it('leaves plain text untouched', () => {
    expect(escapeHtml('山田太郎')).toBe('山田太郎')
  })
})

describe('formatDateTime', () => {
  it('renders a ja-locale date/time string', () => {
    const result = formatDateTime('2026-08-05T01:30:00.000Z', 'ja')
    expect(result).toEqual(expect.any(String))
    expect(result.length).toBeGreaterThan(0)
  })

  it('renders an en-locale date/time string', () => {
    const result = formatDateTime('2026-08-05T01:30:00.000Z', 'en')
    expect(result).toContain('2026')
  })
})

describe('formatDate / formatTime (Spec 12.4 {date} and {time})', () => {
  it('renders a long locale date', () => {
    expect(formatDate('2026-08-05T01:30:00.000Z', 'en')).toBe('August 5, 2026')
    expect(formatDate('2026-08-05T01:30:00.000Z', 'ja')).toBe('2026年8月5日')
  })

  it('renders a 24-hour HH:MM time in the booking zone (Asia/Tokyo, UTC+9)', () => {
    expect(formatTime('2026-08-05T01:30:00.000Z')).toBe('10:30')
    expect(formatTime('2026-08-05T18:05:00.000Z')).toBe('03:05')
  })

  it('moves the date forward when the booking-zone date is later than the UTC date', () => {
    expect(formatDate('2026-08-05T18:05:00.000Z', 'en')).toBe('August 6, 2026')
    expect(formatDate('2026-08-05T18:05:00.000Z', 'ja')).toBe('2026年8月6日')
  })
})
