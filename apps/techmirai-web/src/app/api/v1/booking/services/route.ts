import { type NextRequest, NextResponse } from 'next/server'
import {
  BookingApiError,
  SERVICES_CACHE_TTL_SECONDS,
  checkServicesRateLimit,
  handleListBookableServices,
  listBookableServicesRequestSchema,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'

import { getCachedPayload } from '@/lib/payload'
import { extractIp } from '@/lib/request-ip'

export async function GET(request: NextRequest) {
  const rateLimit = await checkServicesRateLimit(extractIp(request))
  if (!rateLimit.success) {
    const { body, status } = toErrorResponse(
      new BookingApiError('RATE_LIMITED', 'Too many requests. Please wait a moment before trying again.'),
    )
    return NextResponse.json(body, { status })
  }

  const parsed = listBookableServicesRequestSchema.safeParse({
    locale: request.nextUrl.searchParams.get('locale'),
  })
  if (!parsed.success) {
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'Invalid query parameters'))
    return NextResponse.json(body, { status })
  }

  try {
    const payload = await getCachedPayload()
    const result = await handleListBookableServices(payload, parsed.data)
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${SERVICES_CACHE_TTL_SECONDS}, s-maxage=${SERVICES_CACHE_TTL_SECONDS}`,
      },
    })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/services]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
