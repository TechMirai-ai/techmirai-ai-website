import { describe, expect, it } from 'vitest'

import { escapeHtml, formatDateTime, resolveLocale } from './shared'

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
