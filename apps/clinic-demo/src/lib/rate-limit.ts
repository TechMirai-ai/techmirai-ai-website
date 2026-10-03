/**
 * Rate limiter with Upstash Redis when env vars are present, in-memory Map fallback otherwise.
 * Sliding window: 5 requests per IP per 60 seconds.
 */

const WINDOW_MS = 60_000
const MAX_REQUESTS = 5

// ---------------------------------------------------------------------------
// In-memory fallback (single-process dev only)
// ---------------------------------------------------------------------------

type MemEntry = { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>()

function memCheck(key: string): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || now >= entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { success: true, remaining: MAX_REQUESTS - 1 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0 }
  }

  entry.count += 1
  return { success: true, remaining: MAX_REQUESTS - entry.count }
}

// ---------------------------------------------------------------------------
// Upstash path (lazy-initialised so the module is safe to import in all envs)
// ---------------------------------------------------------------------------

type RateLimitResult = { success: boolean; remaining: number }

let upstashCheck: ((key: string) => Promise<RateLimitResult>) | null = null

async function getUpstashChecker(): Promise<((key: string) => Promise<RateLimitResult>) | null> {
  if (upstashCheck) return upstashCheck

  const url = process.env['UPSTASH_REDIS_REST_URL']
  const token = process.env['UPSTASH_REDIS_REST_TOKEN']
  if (!url || !token) return null

  try {
    const { Redis } = await import('@upstash/redis')
    const { Ratelimit } = await import('@upstash/ratelimit')

    const redis = new Redis({ url, token })
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '60 s'),
      analytics: false,
      prefix: 'form-rl',
    })

    upstashCheck = async (key: string) => {
      const { success, remaining } = await limiter.limit(key)
      return { success, remaining }
    }
    return upstashCheck
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const checker = await getUpstashChecker()
  if (checker) {
    return checker(ip)
  }
  return memCheck(ip)
}
