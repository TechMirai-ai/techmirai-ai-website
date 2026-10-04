import { after, type NextRequest, NextResponse } from 'next/server'
import { lineWebhookBodySchema, processLineWebhookEvents, verifyLineSignature } from '@techmirai/cms-core/line'

import { getCachedPayload } from '@/lib/payload'
import { getFollowHandlerDeps, getLineAccessTokenPresence, getLineChannelSecret } from '@/lib/line'

// LINE webhook payloads are small JSON (a handful of batched events at
// most) — well under 1MB. Rejected on Content-Length BEFORE request.text()
// reads the body into memory, so an unauthenticated caller with no valid
// signature can't force a large read/HMAC-compute cost by sending an
// oversized body (security-reviewer finding, STEP 2 Part 1).
const MAX_BODY_BYTES = 1 * 1024 * 1024

/**
 * LINE Messaging API webhook — STEP 2 Part 1 foundation (see
 * docs/STEP2-LINE-CATALOGUE.md Part 4.1 step 4). Handles `follow`/`unfollow`
 * events only; every other event type is ignored (message/postback/rich
 * menu handling are later parts).
 *
 * Every request's `x-line-signature` header is verified BEFORE anything else
 * runs — https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/.
 * The raw body string (`request.text()`) is used for both the signature
 * check and the JSON parse; it is never re-serialized, since that could
 * silently break verification (see cms-core's signature.ts doc comment).
 */
export async function POST(request: NextRequest) {
  try {
    getLineChannelSecret()
    getLineAccessTokenPresence()
  } catch (err) {
    // Both required env vars are checked eagerly here, not just the one
    // the signature check needs — a client missing only the access token
    // would otherwise get a silent, log-only reply failure on every real
    // follow event instead of a loud, actionable 500 (see
    // docs/DEPLOY-NEW-CLIENT.md's "Configure LINE" section).
    console.error('[api/line/webhook]', err)
    return NextResponse.json({ success: false, error: 'LINE is not configured' }, { status: 500 })
  }

  // Rejects before request.text() buffers anything. This covers any
  // standard HTTP client (including LINE's own infrastructure) that sends
  // an honest Content-Length. A request that omits it or lies via chunked
  // encoding isn't caught here — closing that fully needs a platform-level
  // body size limit (reverse proxy/host config), noted as defense in depth
  // rather than duplicated as app-level stream-capping logic in this part.
  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-line-signature')

  if (!verifyLineSignature(rawBody, signature, getLineChannelSecret())) {
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 })
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  const body = lineWebhookBodySchema.safeParse(parsedBody)
  if (!body.success) {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  // Respond to LINE immediately; getCachedPayload() and event processing
  // (reply send + customer update) both happen after the response —
  // nothing about acknowledging the webhook needs a Payload instance, so
  // it must not delay the ACK LINE (and the console's "Verify" button)
  // is waiting on. Mirrors the booking reserve route's post-response
  // notification dispatch (src/app/api/v1/booking/reserve/route.ts).
  after(() =>
    getCachedPayload()
      .then((payload) => processLineWebhookEvents(payload, body.data.events, getFollowHandlerDeps()))
      .catch((err: unknown) => {
        console.error(`[api/line/webhook] event processing failed: ${String(err)}`)
      }),
  )

  return NextResponse.json({ success: true })
}
