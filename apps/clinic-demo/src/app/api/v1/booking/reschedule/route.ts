import { after, type NextRequest, NextResponse } from 'next/server'
import {
  BookingApiError,
  checkRescheduleRateLimit,
  handleReschedule,
  rescheduleRequestSchema,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'
import { notifyBookingCancelled, notifyBookingCreated } from '@techmirai/cms-core/notifications'

import { getCachedPayload } from '@/lib/payload'
import { getNotificationDispatcher, getNotificationRuntimeConfig } from '@/lib/notifications'
import { extractIp } from '@/lib/request-ip'
import siteConfig from '../../../../../../site.config'

export async function POST(request: NextRequest) {
  const rateLimit = await checkRescheduleRateLimit(extractIp(request))
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

  const parsed = rescheduleRequestSchema.safeParse(json)
  if (!parsed.success) {
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'Invalid request body'))
    return NextResponse.json(body, { status })
  }

  try {
    const payload = await getCachedPayload()
    const result = await handleReschedule(payload, parsed.data, siteConfig.booking.cancellationCutoffHours)

    after(() => {
      const dispatcher = getNotificationDispatcher()
      const config = getNotificationRuntimeConfig()

      const notifyNew = notifyBookingCreated(payload, dispatcher, config, {
        confirmationCode: result.confirmation_code,
        isReschedule: true,
      }).catch((notifyErr: unknown) => {
        payload.logger.error(`[api/v1/booking/reschedule] new-appointment notification dispatch failed: ${String(notifyErr)}`)
      })

      // Only tell staff a slot freed up if it actually did — a failed
      // best-effort cancel (see reschedule.ts) must not falsely report the
      // old slot as available again.
      const notifyOld = result.old_appointment_cancelled
        ? notifyBookingCancelled(payload, dispatcher, config, {
            confirmationCode: parsed.data.confirmation_code,
            // STEP 2 Part 4 item 4: the customer already gets the
            // "rescheduled" confirmation via notifyNew above — suppress the
            // new customer-facing cancellation message for this old
            // appointment so a reschedule doesn't ALSO send a redundant
            // "your appointment was cancelled" notice. The staff alert and
            // reminder-voiding steps are unaffected by this flag.
            isReschedule: true,
          }).catch((notifyErr: unknown) => {
            payload.logger.error(`[api/v1/booking/reschedule] old-appointment notification dispatch failed: ${String(notifyErr)}`)
          })
        : Promise.resolve()

      return Promise.all([notifyNew, notifyOld])
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/reschedule]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
