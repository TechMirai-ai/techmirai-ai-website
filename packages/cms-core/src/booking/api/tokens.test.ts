import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('tokens', () => {
  beforeEach(() => {
    vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('derives the same access token for the same idempotency key', async () => {
    const { deriveAccessToken } = await import('./tokens')
    expect(deriveAccessToken('key-abc')).toBe(deriveAccessToken('key-abc'))
  })

  it('derives different access tokens for different idempotency keys', async () => {
    const { deriveAccessToken } = await import('./tokens')
    expect(deriveAccessToken('key-abc')).not.toBe(deriveAccessToken('key-def'))
  })

  it('throws a clear error when BOOKING_TOKEN_SECRET is not configured', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('BOOKING_TOKEN_SECRET', '')
    const { deriveAccessToken } = await import('./tokens')
    expect(() => deriveAccessToken('key-abc')).toThrow(/BOOKING_TOKEN_SECRET/)
  })

  it('hashes a token deterministically', async () => {
    const { hashAccessToken } = await import('./tokens')
    expect(hashAccessToken('token-value')).toBe(hashAccessToken('token-value'))
    expect(hashAccessToken('token-value')).not.toBe(hashAccessToken('other-token'))
  })

  it('verifies a token against its own hash', async () => {
    const { hashAccessToken, verifyAccessToken } = await import('./tokens')
    const hash = hashAccessToken('token-value')
    expect(verifyAccessToken('token-value', hash)).toBe(true)
    expect(verifyAccessToken('wrong-token', hash)).toBe(false)
  })

  it('rejects a stored hash of a different length without throwing', async () => {
    const { verifyAccessToken } = await import('./tokens')
    expect(verifyAccessToken('token-value', 'short')).toBe(false)
  })

  it('rejects a null or undefined stored hash without throwing', async () => {
    const { verifyAccessToken } = await import('./tokens')
    // accessTokenHash is optional in the DB (see entities.ts) — a caller
    // that forgets to guard for that must still get `false`, not a crash.
    expect(verifyAccessToken('token-value', null as unknown as string)).toBe(false)
    expect(verifyAccessToken('token-value', undefined as unknown as string)).toBe(false)
  })

  it('dummyVerify runs the same comparison shape as a real verify without throwing', async () => {
    const { dummyVerify } = await import('./tokens')
    expect(() => dummyVerify('any-token')).not.toThrow()
  })

  // Node's native ESM crypto module can't be spied on in this runner ("Cannot
  // redefine property: timingSafeEqual" / mocks silently not applied to
  // dynamically-imported built-ins), so we can't assert "calls
  // timingSafeEqual" as a unit here without fighting the test framework
  // rather than testing real behavior. The guarantee that actually matters —
  // a wrong token and a nonexistent code are indistinguishable by response —
  // is covered end-to-end in cancel.integration.test.ts and
  // lookup.integration.test.ts.

  describe('deriveLinkToken', () => {
    it('derives the same link token for the same idempotency key', async () => {
      const { deriveLinkToken } = await import('./tokens')
      expect(deriveLinkToken('key-abc')).toBe(deriveLinkToken('key-abc'))
    })

    it('derives different link tokens for different idempotency keys', async () => {
      const { deriveLinkToken } = await import('./tokens')
      expect(deriveLinkToken('key-abc')).not.toBe(deriveLinkToken('key-def'))
    })

    it('derives a different value than deriveAccessToken for the same idempotency key', async () => {
      // WO-5: linkToken must be a genuinely distinct secret from
      // access_token, not just a differently-named alias for it — an emailed
      // link must not be able to leak the permanent access_token.
      const { deriveAccessToken, deriveLinkToken } = await import('./tokens')
      expect(deriveLinkToken('key-abc')).not.toBe(deriveAccessToken('key-abc'))
    })

    it('throws a clear error when BOOKING_TOKEN_SECRET is not configured', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('BOOKING_TOKEN_SECRET', '')
      const { deriveLinkToken } = await import('./tokens')
      expect(() => deriveLinkToken('key-abc')).toThrow(/BOOKING_TOKEN_SECRET/)
    })
  })

  describe('DUMMY_HASH', () => {
    it('is exported so callers can pad a missing hash column to the same shape as a real one', async () => {
      // entities.ts must be able to pass DUMMY_HASH in place of a null
      // manageLinkTokenHash/accessTokenHash so verifyAccessToken always does
      // a real timingSafeEqual, never a free short-circuit — otherwise an
      // appointment missing one of the two hash columns would verify faster
      // than one with both set, a timing oracle for "has this appointment
      // ever had a manage link generated".
      const { DUMMY_HASH, verifyAccessToken } = await import('./tokens')
      expect(typeof DUMMY_HASH).toBe('string')
      expect(verifyAccessToken('any-real-token', DUMMY_HASH)).toBe(false)
    })
  })

  // dummyVerify must now burn TWO comparisons worth of work, not one, to
  // match entities.ts's "found" branch checking two hash columns
  // (access_token + linkToken). Same ESM-native-crypto limitation as above
  // prevents asserting call counts on an internal call from a unit test
  // (vi.spyOn on a dynamically-imported module's export does not intercept
  // that module's own internal references to itself) — the actual op-count
  // parity between the found and not-found paths is covered end-to-end in
  // entities.test.ts and cancel.integration.test.ts / lookup.integration.test.ts.
})
