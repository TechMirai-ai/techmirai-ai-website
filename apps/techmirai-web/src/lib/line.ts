import 'server-only'
import { sendLineReply, verifyLineIdToken } from '@techmirai/cms-core/line'
import type { FollowHandlerDeps } from '@techmirai/cms-core/line'

import siteConfig from '../../site.config'

const CHANNEL_SECRET_ENV_VAR = 'LINE_CHANNEL_SECRET'
const ACCESS_TOKEN_ENV_VAR = 'LINE_CHANNEL_ACCESS_TOKEN'
const LOGIN_CHANNEL_ID_ENV_VAR = 'LINE_LOGIN_CHANNEL_ID'

function requireEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[line] ${name} is not configured. Set it in .env.local.`)
  }
  return value
}

/**
 * Required for the webhook's signature check — thrown eagerly (mirrors
 * payload.config.ts's DATABASE_URI check) so a client deployed without this
 * set fails loudly on the first webhook hit, not with a silently-always-401
 * endpoint.
 */
export function getLineChannelSecret(): string {
  return requireEnvVar(CHANNEL_SECRET_ENV_VAR)
}

/**
 * Exported so the notification composition root (lib/notifications.ts) can
 * pass it as LineMessagingChannel's token getter — read lazily at push time,
 * same eager-fail-only-when-actually-needed rationale as getFollowHandlerDeps'
 * sendReply closure below.
 */
export function getLineAccessToken(): string {
  return requireEnvVar(ACCESS_TOKEN_ENV_VAR)
}

/**
 * Presence-only check for the route's upfront config validation — same
 * eager-fail rationale as getLineChannelSecret(), covering the token too so
 * a client missing only this var gets a loud 500 instead of a silent,
 * log-only reply failure on every real follow event (see handlers.ts's
 * try/catch around sendReply).
 */
export function getLineAccessTokenPresence(): void {
  requireEnvVar(ACCESS_TOKEN_ENV_VAR)
}

/**
 * Combines the site's existing ja/en reception greeting
 * (site.config.ts reception.greeting — already used by the web reception
 * widget) into one bilingual LINE text message. A follow event carries no
 * locale signal to pick just one language from.
 */
export function getLineGreetingText(): string {
  const { greeting } = siteConfig.reception
  return [greeting['ja'], greeting['en']].filter(Boolean).join('\n\n---\n\n')
}

/**
 * The composition root for the LINE webhook's follow-reply dependency —
 * mirrors lib/notifications.ts's getNotificationDispatcher(). The access
 * token is read lazily inside the closure so a missing token fails at
 * send time (logged, non-fatal — see handlers.ts's try/catch) rather than
 * at request setup, same rationale as lib/notifications.ts's Resend key.
 */
export function getFollowHandlerDeps(): FollowHandlerDeps {
  return {
    sendReply: (replyToken, messages) => sendLineReply(replyToken, messages, getLineAccessToken()),
    greetingText: getLineGreetingText(),
  }
}

function getLineLoginChannelId(): string {
  return requireEnvVar(LOGIN_CHANNEL_ID_ENV_VAR)
}

/**
 * The single call site every route needing a trusted LINE user id goes
 * through (STEP 2 Part 2 items 4 & 6: the reserve route and the
 * line-customer-lookup route both use this). Never trust a raw
 * liff.getProfile()/liff.getIDToken() claim from the client directly — see
 * @techmirai/cms-core/line's id-token.ts doc comment for why. Returns null
 * for "no token was sent" (a plain web/chat booking) and for "the token
 * didn't verify" — callers treat those identically, same as
 * verifyLineIdToken itself.
 *
 * NOTE: this does NOT swallow every failure — getLineLoginChannelId()
 * throws synchronously (fail-loud, matching getLineChannelSecret()'s own
 * eager-check philosophy) if LINE_LOGIN_CHANNEL_ID is unset, but only when
 * rawIdToken is actually present (a client that never sends a token never
 * triggers it). Both current call sites already run this inside a
 * try/catch that degrades to a safe error response; a future caller must
 * do the same rather than assuming this can never throw.
 */
export async function resolveVerifiedLineUserId(rawIdToken: string | undefined): Promise<string | null> {
  if (!rawIdToken) return null
  return verifyLineIdToken(rawIdToken, getLineLoginChannelId())
}
