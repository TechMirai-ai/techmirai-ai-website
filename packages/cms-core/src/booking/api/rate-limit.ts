export interface RateLimitResult {
  success: boolean
  remaining: number
}

/**
 * Backend-agnostic rate limiter contract. checkReserveRateLimit() below is
 * wired to the in-memory implementation by default; swapping in a
 * shared-store implementation (e.g. an Upstash-backed limiter, matching
 * apps/clinic-demo/src/lib/rate-limit.ts's approach for contact forms) is a
 * change to that one wiring point, not to any call site.
 */
export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>
}

const WINDOW_MS = 60_000
const MAX_REQUESTS = 5
/** Hard cap on distinct tracked keys — bounds memory/scan cost independent of the TTL sweep (see createInMemoryRateLimiter's doc comment). */
const MAX_TRACKED_KEYS = 10_000

interface InMemoryRateLimiter extends RateLimiter {
  /** Current entry count — exposed for tests to verify eviction, not part of the RateLimiter contract. */
  size(): number
}

/**
 * In-memory sliding-window limiter. Deliberately simple, per the WO-2 spec's
 * "simple IP rate limiting" requirement.
 *
 * KNOWN LIMITATION: state is process-local. It does not share counts across
 * serverless instances or horizontally-scaled processes, so an attacker
 * distributed across instances (or a redeploy resetting the map) can exceed
 * the intended limit. Deliberate for now — revisit with a shared store as
 * part of WO-8's production hardening pass.
 */
export function createInMemoryRateLimiter(
  windowMs: number = WINDOW_MS,
  maxRequests: number = MAX_REQUESTS,
  maxTrackedKeys: number = MAX_TRACKED_KEYS,
): InMemoryRateLimiter {
  const store = new Map<string, { count: number; resetAt: number }>()

  // Every distinct key this is ever called with (e.g. an IP, or whatever an
  // attacker rotates a spoofable header to) gets an entry that otherwise
  // lives forever if that key never comes back. Sweeping expired entries on
  // every check keeps a long-running process's memory bounded by recently
  // active keys, not by every key ever seen.
  function pruneExpired(now: number): void {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key)
    }
  }

  return {
    async check(key: string): Promise<RateLimitResult> {
      const now = Date.now()
      pruneExpired(now)
      const entry = store.get(key)

      if (!entry || now >= entry.resetAt) {
        // Even after pruning, a burst of distinct keys within a single
        // active window can still grow the store proportional to request
        // volume. Once at the cap, stop tracking brand-new keys rather than
        // growing further — fails open (allows the request) rather than
        // risking blocking legitimate traffic under a cardinality attack;
        // already-tracked keys are unaffected and keep being enforced below.
        if (store.size >= maxTrackedKeys) {
          return { success: true, remaining: maxRequests - 1 }
        }
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { success: true, remaining: maxRequests - 1 }
      }

      if (entry.count >= maxRequests) {
        return { success: false, remaining: 0 }
      }

      entry.count += 1
      return { success: true, remaining: maxRequests - entry.count }
    },
    size(): number {
      return store.size
    },
  }
}

// One shared limiter instance, namespaced per endpoint below — each
// endpoint's quota is independent (exhausting /reserve's limit does not
// block /cancel or /lookup for the same IP), while still sharing one Map and
// one eviction sweep rather than three unpruned instances.
const defaultLimiter: RateLimiter = createInMemoryRateLimiter()

/** IP rate limit for POST /reserve. */
export function checkReserveRateLimit(ip: string): Promise<RateLimitResult> {
  return defaultLimiter.check(`reserve:${ip}`)
}

/** IP rate limit for POST /cancel. */
export function checkCancelRateLimit(ip: string): Promise<RateLimitResult> {
  return defaultLimiter.check(`cancel:${ip}`)
}

/** IP rate limit for GET /lookup. */
export function checkLookupRateLimit(ip: string): Promise<RateLimitResult> {
  return defaultLimiter.check(`lookup:${ip}`)
}

/**
 * IP rate limit for POST /line-customer-lookup (STEP 2 Part 2 item 6). Own
 * namespaced bucket, not shared with /services — unlike the service catalog
 * read, each call here costs a real network round-trip to LINE's own verify
 * endpoint, closer in cost/abuse shape to the mutating endpoints above than
 * to a cacheable local read.
 */
export function checkLineCustomerLookupRateLimit(ip: string): Promise<RateLimitResult> {
  return defaultLimiter.check(`line-customer-lookup:${ip}`)
}

/**
 * IP rate limit for POST /line-manage-lookup (STEP 2 Part 4 items 1/3). Own
 * namespaced bucket, same rationale as checkLineCustomerLookupRateLimit
 * above: a real network round-trip to LINE's own verify endpoint per call.
 */
export function checkLineManageLookupRateLimit(ip: string): Promise<RateLimitResult> {
  return defaultLimiter.check(`line-manage-lookup:${ip}`)
}

/**
 * IP rate limit for POST /reschedule. Same 5/60s bucket shape as
 * cancel/lookup — WO-2's per-IP limiting is sufficient here too (see
 * reschedule.ts's doc comment): both confirmation_code and the
 * access_token/linkToken pair are high-entropy, so brute force is
 * infeasible well above this threshold, and a code-keyed lockout would be a
 * free DoS against the appointment's own owner (the code is visible on the
 * success screen and in email).
 */
export function checkRescheduleRateLimit(ip: string): Promise<RateLimitResult> {
  return defaultLimiter.check(`reschedule:${ip}`)
}

// /availability is read-only, public, non-PII, and cacheable — a much
// higher threshold than the mutating/sensitive endpoints, just as a backstop
// against direct DB load for deployments where a CDN cache isn't actually in
// front of the origin (e.g. local dev, staging, pre-cache-warm).
const availabilityLimiter: RateLimiter = createInMemoryRateLimiter(60_000, 60)

/** IP rate limit for GET /availability. */
export function checkAvailabilityRateLimit(ip: string): Promise<RateLimitResult> {
  return availabilityLimiter.check(ip)
}

// The service catalog is public, read-only, and changes far less often than
// slot availability — same generous 60/min threshold as /availability, for
// the same "backstop, not the real defense" reason (see availabilityLimiter).
const servicesLimiter: RateLimiter = createInMemoryRateLimiter(60_000, 60)

/** IP rate limit for GET /services. */
export function checkServicesRateLimit(ip: string): Promise<RateLimitResult> {
  return servicesLimiter.check(ip)
}
