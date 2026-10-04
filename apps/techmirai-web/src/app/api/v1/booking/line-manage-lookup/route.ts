import { type NextRequest, NextResponse } from 'next/server'
import {
  BookingApiError,
  checkLineManageLookupRateLimit,
  handleLineManageLookup,
  lineManageLookupRequestSchema,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'

import { getCachedPayload } from '@/lib/payload'
import { extractIp } from '@/lib/request-ip'
import { resolveVerifiedLineUserId } from '@/lib/line'

/**
 * STEP 2 Part 4 items 1/3: the LIFF manage page's own identity-scoped
 * lookup. Mirrors line-customer-lookup/route.ts's shape exactly — the raw
 * LINE ID token is verified server-side (never a client-asserted
 * lineUserId) before anything below trusts it for a customer lookup.
 */
export async function POST(request: NextRequest) {
  const rateLimit = await checkLineManageLookupRateLimit(extractIp(request))
  if (!rateLimit.success) {
    const { body, status } = toErrorResponse(
      new BookingApiError('RATE_LIMITED', 'Too many requests. Please wait a moment before trying again.'),
    )
    return NextResponse.json(body, { status })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'Invalid request body'))
    return NextResponse.json(body, { status })
  }

  const parsed = lineManageLookupRequestSchema.safeParse(json)
  if (!parsed.success) {
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'Invalid request body'))
    return NextResponse.json(body, { status })
  }

  try {
    // Independent of each other — run concurrently rather than paying the
    // LINE-verify round-trip and Payload init latency serially.
    const [verifiedLineUserId, payload] = await Promise.all([
      resolveVerifiedLineUserId(parsed.data.line_id_token),
      getCachedPayload(),
    ])
    if (!verifiedLineUserId) {
      const { body, status } = toErrorResponse(new BookingApiError('UNAUTHORIZED', 'Invalid or expired LINE session'))
      return NextResponse.json(body, { status })
    }

    const result = await handleLineManageLookup(payload, verifiedLineUserId, parsed.data.locale)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/line-manage-lookup]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
