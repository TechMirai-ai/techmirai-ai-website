import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { verifyLineSignature } from './signature'

const CHANNEL_SECRET = 'test-channel-secret'

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('base64')
}

describe('verifyLineSignature', () => {
  it('accepts a signature computed the same way LINE computes it (HMAC-SHA256, base64)', () => {
    const body = JSON.stringify({ destination: 'xxx', events: [] })
    const signature = sign(body, CHANNEL_SECRET)
    expect(verifyLineSignature(body, signature, CHANNEL_SECRET)).toBe(true)
  })

  it('rejects a signature computed with the wrong channel secret', () => {
    const body = JSON.stringify({ destination: 'xxx', events: [] })
    const signature = sign(body, 'wrong-secret')
    expect(verifyLineSignature(body, signature, CHANNEL_SECRET)).toBe(false)
  })

  it('rejects when the body has been tampered with after signing', () => {
    const originalBody = JSON.stringify({ destination: 'xxx', events: [] })
    const signature = sign(originalBody, CHANNEL_SECRET)
    const tamperedBody = JSON.stringify({ destination: 'xxx', events: [{ type: 'follow' }] })
    expect(verifyLineSignature(tamperedBody, signature, CHANNEL_SECRET)).toBe(false)
  })

  it('rejects a missing signature header', () => {
    const body = JSON.stringify({ destination: 'xxx', events: [] })
    expect(verifyLineSignature(body, null, CHANNEL_SECRET)).toBe(false)
  })

  it('rejects an empty-string signature header', () => {
    const body = JSON.stringify({ destination: 'xxx', events: [] })
    expect(verifyLineSignature(body, '', CHANNEL_SECRET)).toBe(false)
  })

  it('rejects a well-formed but wrong-length signature', () => {
    const body = JSON.stringify({ destination: 'xxx', events: [] })
    expect(verifyLineSignature(body, 'short', CHANNEL_SECRET)).toBe(false)
  })

  it('verifies against the exact raw body bytes, not a re-serialized copy', () => {
    // Re-serializing parsed JSON can reorder keys/whitespace — the check
    // must run against LINE's exact raw string, never a round-tripped copy.
    const body = '{"destination":"xxx","events":[]}'
    const signature = sign(body, CHANNEL_SECRET)
    const withInsertedWhitespace = body.replace('"xxx"', ' "xxx"')

    expect(verifyLineSignature(body, signature, CHANNEL_SECRET)).toBe(true)
    expect(verifyLineSignature(withInsertedWhitespace, signature, CHANNEL_SECRET)).toBe(false)
  })
})
