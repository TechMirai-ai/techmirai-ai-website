import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const SECRET_ENV_VAR = 'BOOKING_TOKEN_SECRET'

function getTokenSecret(): string {
  const secret = process.env[SECRET_ENV_VAR]
  if (!secret) {
    throw new Error(`${SECRET_ENV_VAR} is not configured`)
  }
  return secret
}

/**
 * Deterministically derives the raw access token from the idempotency key so
 * a retried /reserve request (same idempotency_key, hitting the engine's fast
 * idempotency path) gets back a token that still authenticates against the
 * accessTokenHash stored on the original appointment — a freshly-random token
 * would not match it.
 *
 * Security depends on idempotency_key being unpredictable — see the field
 * comment on reserveRequestSchema.idempotency_key in schemas.ts.
 */
export function deriveAccessToken(idempotencyKey: string): string {
  return createHmac('sha256', getTokenSecret()).update(idempotencyKey).digest('base64url')
}

/**
 * Deterministically derives the raw manage-link token from the same
 * idempotency key access_token is derived from, domain-separated by the
 * 'link:' prefix so the two are cryptographically unrelated — knowing one
 * does not reveal the other, and this is NOT just a differently-named alias
 * for deriveAccessToken. This is the credential embedded in the customer's
 * "manage your appointment" link (on-screen and emailed): unlike
 * access_token, it is meant to be expiring (see manageLinkTokenExpiresAt on
 * the appointments collection) so a leaked email link has a bounded blast
 * radius, whereas access_token never expires.
 */
export function deriveLinkToken(idempotencyKey: string): string {
  return createHmac('sha256', getTokenSecret()).update(`link:${idempotencyKey}`).digest('base64url')
}

/**
 * Fixed TTL for the manage-link credential, not a site-config knob (YAGNI —
 * no tenant has asked for a different value). Bounds a leaked/forwarded
 * email link's blast radius; access_token itself never expires.
 */
export const LINK_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

export function hashAccessToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Fixed-length placeholder with the same shape as a real sha256 hex digest.
 * Used by dummyVerify() to burn a comparable amount of time when no stored
 * hash exists, so a nonexistent code and a wrong token are indistinguishable
 * by response latency (see cancel.ts / lookup.ts). Exported so entities.ts
 * can also pass it in place of a null accessTokenHash/manageLinkTokenHash on
 * a *found* appointment — an appointment missing one of the two hash columns
 * must still pay for a real timingSafeEqual on that column, not a free
 * short-circuit, or its presence/absence becomes a timing oracle.
 */
export const DUMMY_HASH = '0'.repeat(64)

/**
 * Burns two comparisons' worth of work, matching verifyAppointmentAccess's
 * "found" branch in entities.ts, which now checks two hash columns
 * (access_token, linkToken) instead of one. Without this, a nonexistent
 * confirmation_code would become cheaper to probe than a real one again —
 * the same class of timing oracle a WO-2 security-scan fix already had to
 * close once (see entities.ts's doc comment on DB-I/O timing).
 */
export function dummyVerify(token: string): void {
  verifyAccessToken(token, DUMMY_HASH)
  verifyAccessToken(token, DUMMY_HASH)
}

export function verifyAccessToken(token: string, storedHash: string | null | undefined): boolean {
  // storedHash is optional in the DB (accessTokenHash is not a required
  // field — see entities.ts's AppointmentWithSlot doc comment); treat a
  // missing hash as "cannot match" rather than crashing.
  if (typeof storedHash !== 'string') return false
  const provided = Buffer.from(hashAccessToken(token), 'utf8')
  const stored = Buffer.from(storedHash, 'utf8')
  if (provided.length !== stored.length) return false
  return timingSafeEqual(provided, stored)
}
