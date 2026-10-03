import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  checkAvailabilityRateLimit,
  checkCancelRateLimit,
  checkLookupRateLimit,
  checkReserveRateLimit,
  checkServicesRateLimit,
  createInMemoryRateLimiter,
} from './rate-limit'

describe('createInMemoryRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests up to the limit', async () => {
    const limiter = createInMemoryRateLimiter(60_000, 3)
    expect((await limiter.check('ip-1')).success).toBe(true)
    expect((await limiter.check('ip-1')).success).toBe(true)
    expect((await limiter.check('ip-1')).success).toBe(true)
  })

  it('blocks the request after the limit is exceeded', async () => {
    const limiter = createInMemoryRateLimiter(60_000, 2)
    await limiter.check('ip-1')
    await limiter.check('ip-1')
    const third = await limiter.check('ip-1')
    expect(third.success).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('decrements remaining on each successful check', async () => {
    const limiter = createInMemoryRateLimiter(60_000, 3)
    expect((await limiter.check('ip-1')).remaining).toBe(2)
    expect((await limiter.check('ip-1')).remaining).toBe(1)
    expect((await limiter.check('ip-1')).remaining).toBe(0)
  })

  it('tracks separate keys independently', async () => {
    const limiter = createInMemoryRateLimiter(60_000, 1)
    expect((await limiter.check('ip-1')).success).toBe(true)
    expect((await limiter.check('ip-2')).success).toBe(true)
    expect((await limiter.check('ip-1')).success).toBe(false)
  })

  it('resets the window after it elapses', async () => {
    const limiter = createInMemoryRateLimiter(60_000, 1)
    expect((await limiter.check('ip-1')).success).toBe(true)
    expect((await limiter.check('ip-1')).success).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect((await limiter.check('ip-1')).success).toBe(true)
  })

  it('caps tracked key cardinality so an attacker generating many distinct keys within one window cannot grow the store unboundedly', async () => {
    // pruneExpired only reclaims keys once their window has elapsed — within
    // a single active window, an attacker (or anything else) generating many
    // distinct keys can still grow the store proportional to request volume,
    // and every check() pays an O(current size) scan cost. A hard cap bounds
    // both regardless of how many distinct keys arrive before anything expires.
    const limiter = createInMemoryRateLimiter(60_000, 5, 3)
    await limiter.check('a')
    await limiter.check('b')
    await limiter.check('c')
    expect(limiter.size()).toBe(3)

    await limiter.check('d')
    expect(limiter.size()).toBe(3)
  })

  it('still rate-limits already-tracked keys normally once the cap is reached', async () => {
    const limiter = createInMemoryRateLimiter(60_000, 2, 1)
    expect((await limiter.check('a')).success).toBe(true)
    expect((await limiter.check('a')).success).toBe(true)
    expect((await limiter.check('a')).success).toBe(false)
  })

  it('evicts expired entries instead of retaining one per distinct key forever', async () => {
    // A long-running process (or an attacker rotating the header this is
    // keyed on) must not grow this Map without bound — expired entries
    // should be swept, not just overwritten if the same key happens to
    // return.
    const limiter = createInMemoryRateLimiter(60_000, 5)
    for (let i = 0; i < 100; i += 1) {
      await limiter.check(`ip-${i}`)
    }
    expect(limiter.size()).toBe(100)

    vi.advanceTimersByTime(60_001)
    await limiter.check('ip-new')

    expect(limiter.size()).toBe(1)
  })
})

describe('checkReserveRateLimit', () => {
  it('returns a rate limit result for an IP', async () => {
    const result = await checkReserveRateLimit('203.0.113.1')
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('remaining')
  })
})

describe('checkCancelRateLimit / checkLookupRateLimit / checkAvailabilityRateLimit', () => {
  it('are rate limited independently of /reserve and of each other for the same IP', async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`

    // Exhaust /reserve's limit for this IP.
    for (let i = 0; i < 5; i += 1) {
      await checkReserveRateLimit(ip)
    }
    expect((await checkReserveRateLimit(ip)).success).toBe(false)

    // /cancel, /lookup, and /availability must still have their own
    // untouched quota.
    expect((await checkCancelRateLimit(ip)).success).toBe(true)
    expect((await checkLookupRateLimit(ip)).success).toBe(true)
    expect((await checkAvailabilityRateLimit(ip)).success).toBe(true)
  })
})

describe('checkServicesRateLimit', () => {
  it('returns a rate limit result for an IP', async () => {
    const result = await checkServicesRateLimit('203.0.113.50')
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('remaining')
  })

  it('is rate limited independently of /availability for the same IP', async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`

    for (let i = 0; i < 60; i += 1) {
      await checkAvailabilityRateLimit(ip)
    }
    expect((await checkAvailabilityRateLimit(ip)).success).toBe(false)

    expect((await checkServicesRateLimit(ip)).success).toBe(true)
  })
})
