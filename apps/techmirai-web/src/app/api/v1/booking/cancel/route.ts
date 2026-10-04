import { after, type NextRequest, NextResponse } from 'next/server'
import {
  BookingApiError,
  cancelRequestSchema,
  checkCancelRateLimit,
  handleCancel,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'
import { notifyBookingCancelled } from '@techmirai/cms-core/notifications'

import { getCachedPayload } from '@/lib/payload'
import { getNotificationDispatcher, getNotificationRuntimeConfig } from '@/lib/notifications'
import { extractIp } from '@/lib/request-ip'
import siteConfig from '../../../../../../site.config'

export async function POST(request: NextRequest) {
  const rateLimit = await checkCancelRateLimit(extractIp(request))
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

  const parsed = cancelRequestSchema.safeParse(json)
  if (!parsed.success) {
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'Invalid request body'))
    return NextResponse.json(body, { status })
  }

  try {
    const payload = await getCachedPayload()
    const result = await handleCancel(payload, parsed.data, siteConfig.booking.cancellationCutoffHours)

    after(() =>
      notifyBookingCancelled(payload, getNotificationDispatcher(), getNotificationRuntimeConfig(), {
        confirmationCode: parsed.data.confirmation_code,
      }).catch((notifyErr: unknown) => {
        payload.logger.error(`[api/v1/booking/cancel] notification dispatch failed: ${String(notifyErr)}`)
      }),
    )

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/cancel]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
