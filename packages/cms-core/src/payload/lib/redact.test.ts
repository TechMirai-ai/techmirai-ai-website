import { describe, expect, it } from 'vitest'
import { escapeHtml, redactPii } from './redact'

describe('redactPii', () => {
  it('masks email addresses', () => {
    expect(redactPii('failed for taro@example.com today')).toBe('failed for [email redacted] today')
  })

  it('masks Japanese and international phone numbers', () => {
    expect(redactPii('call 090-1234-5678 now')).toBe('call [phone redacted] now')
    expect(redactPii('call +81 90 1234 5678 now')).toBe('call [phone redacted] now')
  })

  it('leaves text without personal data unchanged', () => {
    expect(redactPii('Resend API error (422): invalid sender')).toBe('Resend API error (422): invalid sender')
  })
})

describe('escapeHtml', () => {
  it('escapes markup so submitted text cannot inject elements', () => {
    expect(escapeHtml('<script>alert("x")</script> & more')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more',
    )
  })

  it('leaves plain text, including Japanese, unchanged', () => {
    expect(escapeHtml('山田 太郎 / Taro')).toBe('山田 太郎 / Taro')
  })
})
