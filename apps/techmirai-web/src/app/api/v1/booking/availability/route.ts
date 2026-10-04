import { type NextRequest, NextResponse } from 'next/server'
import {
  AVAILABILITY_CACHE_TTL_SECONDS,
  BookingApiError,
  availabilityRequestSchema,
  checkAvailabilityRateLimit,
  handleAvailability,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'

import { getCachedPayload } from '@/lib/payload'
import { extractIp } from '@/lib/request-ip'

export async function GET(request: NextRequest) {
  const rateLimit = await checkAvailabilityRateLimit(extractIp(request))
  if (!rateLimit.success) {
    const { body, status } = toErrorResponse(
      new BookingApiError('RATE_LIMITED', 'Too many requests. Please wait a moment before trying again.'),
    )
    return NextResponse.json(body, { status })
  }

  const searchParams = request.nextUrl.searchParams
  const parsed = availabilityRequestSchema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    service_id: searchParams.get('service_id'),
    resource_id: searchParams.get('resource_id') ?? undefined,
  })
  if (!parsed.success) {
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'Invalid query parameters'))
    return NextResponse.json(body, { status })
  }

  try {
    const payload = await getCachedPayload()
    const result = await handleAvailability(payload, parsed.data)
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${AVAILABILITY_CACHE_TTL_SECONDS}, s-maxage=${AVAILABILITY_CACHE_TTL_SECONDS}`,
      },
    })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/availability]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
