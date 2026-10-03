import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verifies LINE's `x-line-signature` webhook header: HMAC-SHA256 of the raw
 * request body, base64-encoded, keyed by the channel secret — per
 * https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/
 * ("Generates a signature with HMAC-SHA256 using the webhook event as input
 * data and the channel secret as the hash key").
 *
 * `rawBody` MUST be the exact byte string LINE sent (e.g. `request.text()`),
 * never a re-serialized `JSON.stringify(JSON.parse(rawBody))` — re-encoding
 * can reorder keys/whitespace and silently break verification. Comparison is
 * timing-safe, mirroring this repo's existing token-comparison pattern
 * (../booking/api/tokens.ts's verifyAccessToken).
 */
export function verifyLineSignature(
  rawBody: string,
  signatureHeader: string | null,
  channelSecret: string,
): boolean {
  if (!signatureHeader) return false

  const expected = createHmac('sha256', channelSecret).update(rawBody, 'utf8').digest('base64')

  const provided = Buffer.from(signatureHeader, 'utf8')
  const expectedBuf = Buffer.from(expected, 'utf8')
  if (provided.length !== expectedBuf.length) return false

  return timingSafeEqual(provided, expectedBuf)
}
