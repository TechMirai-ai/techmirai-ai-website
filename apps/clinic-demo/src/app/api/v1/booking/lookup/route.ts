import { type NextRequest, NextResponse } from 'next/server'
import {
  BookingApiError,
  checkLookupRateLimit,
  handleLookup,
  lookupRequestSchema,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'

import { getCachedPayload } from '@/lib/payload'
import { extractIp } from '@/lib/request-ip'

export async function GET(request: NextRequest) {
  const rateLimit = await checkLookupRateLimit(extractIp(request))
  if (!rateLimit.success) {
    const { body, status } = toErrorResponse(
      new BookingApiError('RATE_LIMITED', 'Too many requests. Please wait a moment before trying again.'),
    )
    return NextResponse.json(body, { status })
  }

  // access_token is a bearer secret — it comes in via the Authorization
  // header, never the query string, so it never lands in server/proxy/CDN
  // access logs or (since this is a GET) browser history. `code` alone is
  // not secret and stays a query param.
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined

  const searchParams = request.nextUrl.searchParams
  const parsed = lookupRequestSchema.safeParse({
    code: searchParams.get('code'),
    token,
  })
  if (!parsed.success) {
    // A missing/malformed query param is INVALID_INPUT (a malformed request),
    // not NOT_FOUND — the "identical error for wrong token vs nonexistent
    // code" guarantee only applies once both are present and well-formed;
    // see handleLookup / entities.ts's verifyAppointmentAccess.
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'code and token are required'))
    return NextResponse.json(body, { status })
  }

  try {
    const payload = await getCachedPayload()
    const result = await handleLookup(payload, parsed.data)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/lookup]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
