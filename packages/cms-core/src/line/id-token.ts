/**
 * https://developers.line.biz/en/docs/line-login/verify-id-token/
 * POST https://api.line.me/oauth2/v2.1/verify (application/x-www-form-urlencoded)
 * Body: id_token, client_id (the LINE Login channel ID a LIFF app is
 * registered under — NOT the Messaging API channel).
 *
 * LINE's own LIFF docs are explicit that a client-supplied
 * liff.getProfile()/liff.getDecodedIDToken() result must never be trusted
 * directly server-side ("Don't send the details of the user profile
 * obtained with liff.getDecodedIDToken() and liff.getProfile() to the
 * server from the LIFF app") — only the raw ID token should cross the
 * network, verified here before its `sub` claim (the real LINE user id) is
 * trusted for anything (STEP 2 Part 2 item 4).
 */
const VERIFY_ENDPOINT = 'https://api.line.me/oauth2/v2.1/verify'

// This runs on effectively every LIFF booking-submit and lookup call — a
// hung upstream (LINE's endpoint slow/unreachable) must not hold the
// request open until the platform's own hard timeout.
const VERIFY_TIMEOUT_MS = 5_000

interface VerifyResponseBody {
  sub?: string
}

/**
 * Verifies a raw LIFF ID token against LINE's servers and returns the
 * verified `sub` (LINE user id) on success. Never throws — any failure
 * (network error, rejected token, malformed response, missing claim)
 * returns null, so callers can uniformly treat "couldn't verify" the same
 * way as "no LINE session at all" rather than needing try/catch at every
 * call site.
 */
export async function verifyLineIdToken(rawIdToken: string, channelId: string): Promise<string | null> {
  if (!rawIdToken) return null

  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: rawIdToken, client_id: channelId }).toString(),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    })

    if (!response.ok) return null

    const body = (await response.json()) as VerifyResponseBody
    return typeof body.sub === 'string' && body.sub.length > 0 ? body.sub : null
  } catch {
    return null
  }
}
