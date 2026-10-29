import { type NextRequest, NextResponse } from 'next/server'
import { isValidDemoKey } from '@/lib/demo-access-key'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractIp } from '@/lib/request-ip'

// Checks a live-demo access key against the server-only DEMO_ACCESS_KEYS list.
// The key is never echoed back and never logged.
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

  return NextResponse.json({ valid: isValidDemoKey(key, process.env['DEMO_ACCESS_KEYS']) }, { status: 200 })
}
