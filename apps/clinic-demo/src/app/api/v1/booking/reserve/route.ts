import { after, type NextRequest, NextResponse } from 'next/server'
import {
  BookingApiError,
  checkReserveRateLimit,
  handleReserve,
  reserveRequestSchema,
  toErrorResponse,
  toSafeInternalError,
} from '@techmirai/cms-core/booking/api'
import { notifyBookingCreated } from '@techmirai/cms-core/notifications'

import { getCachedPayload } from '@/lib/payload'
import { getNotificationDispatcher, getNotificationRuntimeConfig } from '@/lib/notifications'
import { extractIp } from '@/lib/request-ip'
import { resolveVerifiedLineUserId } from '@/lib/line'

export async function POST(request: NextRequest) {
  const rateLimit = await checkReserveRateLimit(extractIp(request))
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

  const parsed = reserveRequestSchema.safeParse(json)
  if (!parsed.success) {
    const { body, status } = toErrorResponse(new BookingApiError('INVALID_INPUT', 'Invalid request body'))
    return NextResponse.json(body, { status })
  }

  try {
    // STEP 2 Part 2 item 4: a LIFF booking carries a raw ID token, never a
    // self-asserted lineUserId — verified here against LINE's own servers
    // before handleReserve trusts it for anything (phone-uniqueness
    // matching, item 5, and linking it onto the customer record).
    //
    // A token that was SENT but failed verification (expired session, or a
    // transient network blip talking to LINE) must not be silently treated
    // as "no LINE session" — for a returning, already-linked customer that
    // would fall into handleReserve's anonymous-booking branch and reject
    // with a confusing, non-retryable PHONE_ALREADY_REGISTERED for their
    // own phone number. Mirrors line-customer-lookup/route.ts's identical
    // check.
    // The LINE-verify round-trip (when there's a token to verify) and
    // Payload init are independent — run them concurrently rather than
    // paying both latencies serially.
    const [verifiedLineUserId, payload] = await Promise.all([
      resolveVerifiedLineUserId(parsed.data.line_id_token),
      getCachedPayload(),
    ])
    if (parsed.data.line_id_token && !verifiedLineUserId) {
      const { body, status } = toErrorResponse(
        new BookingApiError('UNAUTHORIZED', 'Invalid or expired LINE session. Please try again.'),
      )
      return NextResponse.json(body, { status })
    }

    const result = await handleReserve(payload, parsed.data, verifiedLineUserId)

    // Runs after the response is sent, but the platform still keeps this
    // invocation alive until it settles — unlike a bare un-awaited promise,
    // which is not guaranteed to finish on a serverless runtime.
    after(() =>
      notifyBookingCreated(payload, getNotificationDispatcher(), getNotificationRuntimeConfig(), {
        confirmationCode: result.confirmation_code,
      }).catch((notifyErr: unknown) => {
        payload.logger.error(`[api/v1/booking/reserve] notification dispatch failed: ${String(notifyErr)}`)
      }),
    )

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const safeErr = toSafeInternalError(err)
    if (safeErr.code === 'INTERNAL') {
      console.error('[api/v1/booking/reserve]', err)
    }
    const { body, status } = toErrorResponse(safeErr)
    return NextResponse.json(body, { status })
  }
}
