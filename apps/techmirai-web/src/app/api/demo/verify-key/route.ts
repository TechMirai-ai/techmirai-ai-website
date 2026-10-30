import { type NextRequest, NextResponse } from 'next/server'
import { getDemoKeyTier } from '@/lib/demo-access-key'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractIp } from '@/lib/request-ip'

// Checks a live-demo key against the server-only DEMO_ACCESS_KEYS (premium) and
// DEMO_NORMAL_KEYS lists. The typed key is never echoed back and never logged.
export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(`demo-key:${extractIp(request)}`)
  if (!rl.success) {
    return NextResponse.json({ valid: false, message: 'Too many requests.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ valid: false, message: 'Invalid request body' }, { status: 400 })
  }

  const key = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)['key'] : undefined
  if (typeof key !== 'string' || key.length === 0 || key.length > 200) {
    return NextResponse.json({ valid: false }, { status: 422 })
  }

  const tier = getDemoKeyTier(key, process.env['DEMO_ACCESS_KEYS'], process.env['DEMO_NORMAL_KEYS'])
  if (tier === null) return NextResponse.json({ valid: false }, { status: 200 })
  if (tier === 'normal') return NextResponse.json({ valid: true, tier }, { status: 200 })

  // Premium visitors get the server-only call URL (it carries the fixed demo key).
  const locale = (body as Record<string, unknown>)['locale'] === 'ja' ? 'ja' : 'en'
  const url = process.env[locale === 'ja' ? 'DEMO_PREMIUM_CALL_URL_JA' : 'DEMO_PREMIUM_CALL_URL_EN']
  return NextResponse.json({ valid: true, tier, ...(url ? { url } : {}) }, { status: 200 })
}
