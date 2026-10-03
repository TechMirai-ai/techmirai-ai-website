import type { LineTextMessage } from './types'

/**
 * https://developers.line.biz/en/reference/messaging-api/#send-reply-message
 * POST https://api.line.me/v2/bot/message/reply
 * Headers: Authorization: Bearer {channel access token}, Content-Type: application/json
 * Body: { replyToken, messages: [...] }
 */
const REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply'

/**
 * https://developers.line.biz/en/reference/messaging-api/#send-push-message
 * POST https://api.line.me/v2/bot/message/push
 * Headers: Authorization: Bearer {channel access token}, Content-Type: application/json
 * Body: { to, messages: [...] }
 * Response (200): { sentMessages: [{ id, quoteToken? }] } — verified against
 * LINE's published OpenAPI spec (line/line-openapi on GitHub), not written
 * from memory.
 */
const PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push'

export class LineReplyError extends Error {}
export class LinePushError extends Error {}

export interface LinePushResult {
  messageId: string
}

/**
 * Shared POST-to-LINE-Messaging-API mechanics for both reply and push:
 * headers and the fetch call itself. Deliberately does NOT interpret the
 * response — reply and push have different success/error shapes and
 * different error types (LineReplyError vs LinePushError), so each caller
 * still does its own response.ok check and throws its own error.
 */
async function postToLineApi(
  endpoint: string,
  body: unknown,
  accessToken: string,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  })
}

/**
 * Sends a reply via LINE's reply endpoint using a webhook event's
 * `replyToken`. Reply tokens are single-use and valid for roughly one
 * minute per LINE's docs (STEP2-LINE-CATALOGUE.md Part 0.4) and, unlike
 * push/multicast/broadcast, do NOT consume the monthly message quota — call
 * this promptly after receiving the webhook event, never queue it for
 * later.
 */
export async function sendLineReply(
  replyToken: string,
  messages: LineTextMessage[],
  accessToken: string,
): Promise<void> {
  const response = await postToLineApi(REPLY_ENDPOINT, { replyToken, messages }, accessToken)

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new LineReplyError(`LINE reply failed (${response.status}): ${detail}`)
  }
}

/**
 * Sends a push message — the only option for a notification with no
 * inbound webhook event to reply to (a day-before reminder, or a
 * confirmation/cancellation triggered by a REST API call rather than a LINE
 * chat turn — see docs/STEP2-LINE-CATALOGUE.md Part 0.4). Unlike a reply,
 * this consumes the monthly message quota, and per LINE's docs a push to a
 * user who has blocked the OA still returns HTTP 200 with silent
 * non-delivery — the `unfollow` webhook (see ../line/handlers.ts) is the
 * only reliable way to detect that, not this call's response.
 *
 * `retryKey`, when provided, is sent as `X-Line-Retry-Key` — LINE's
 * documented idempotency mechanism for this endpoint: if a retry reuses the
 * same key as an earlier attempt whose response was lost (e.g. to a network
 * blip) rather than actually failed, LINE recognizes it as the same request
 * instead of delivering the message a second time.
 */
export async function sendLinePush(
  to: string,
  messages: LineTextMessage[],
  accessToken: string,
  retryKey?: string,
): Promise<LinePushResult> {
  const response = await postToLineApi(
    PUSH_ENDPOINT,
    { to, messages },
    accessToken,
    retryKey ? { 'X-Line-Retry-Key': retryKey } : undefined,
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new LinePushError(`LINE push failed (${response.status}): ${detail}`)
  }

  const data = (await response.json().catch(() => null)) as { sentMessages?: Array<{ id?: string }> } | null
  const messageId = data?.sentMessages?.[0]?.id
  if (!messageId) {
    throw new LinePushError('LINE push returned 200 but no sentMessages[0].id was present in the response body')
  }

  return { messageId }
}
