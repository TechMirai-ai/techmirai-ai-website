import { type NextRequest, NextResponse } from 'next/server'
import {
  BookingApiError,
  checkLineCustomerLookupRateLimit,
  handleLineCustomerLookup,
  lineCustomerLookupRequestSchema,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'

import { getCachedPayload } from '@/lib/payload'
import { extractIp } from '@/lib/request-ip'
import { resolveVerifiedLineUserId } from '@/lib/line'

/**
 * STEP 2 Part 2 item 6: checked once by the LIFF page before it renders
 * the booking form. Reuses the services endpoint's rate limit (a plain
 * read, same low-risk shape as GET /services — no honeypot/booking
 * side-effects to protect here).
 */
export async function POST(request: NextRequest) {
  const rateLimit = await checkLineCustomerLookupRateLimit(extractIp(request))
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

  const parsed = lineCustomerLookupRequestSchema.safeParse(json)
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

    const result = await handleLineCustomerLookup(payload, verifiedLineUserId)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/line-customer-lookup]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
