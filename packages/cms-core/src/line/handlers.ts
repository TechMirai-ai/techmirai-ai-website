import type { Payload } from 'payload'

import { findCustomerByLineUserId } from './customer-lookup'
import type { LineFollowEvent, LineTextMessage, LineUnfollowEvent } from './types'

export interface FollowHandlerDeps {
  sendReply: (replyToken: string, messages: LineTextMessage[]) => Promise<void>
  /** Pre-rendered bilingual (ja/en) greeting text — see apps/techmirai-web's
   * lib/line.ts, which sources this from site.config.ts's existing
   * reception.greeting copy. */
  greetingText: string
}

/**
 * Handles a `follow` event (user added the OA as a friend): replies with the
 * clinic's greeting (a reply, so it's free — no push quota, see
 * docs/STEP2-LINE-CATALOGUE.md Part 0.4) and, if this LINE user is already
 * linked to a customer record (e.g. re-adding after a previous block),
 * clears the `lineChannelDead` failover flag so notifications can go back to
 * LINE for them.
 *
 * Deliberately does NOT create a new customer record for an unmatched
 * follower: a bare follow event carries only a userId, no name/phone to
 * populate the collection's required kanji/kana name fields with, and a
 * LINE profile display name is not a legal name (STEP2-LINE-CATALOGUE.md
 * Part 1). Real linking happens during a LIFF-based booking session (Part
 * 2), which has an actual form to attach the userId to — see that
 * document's Part 4.1 step 4/5 sequencing note.
 */
export async function handleFollowEvent(
  payload: Payload,
  event: LineFollowEvent,
  deps: FollowHandlerDeps,
): Promise<void> {
  try {
    await deps.sendReply(event.replyToken, [{ type: 'text', text: deps.greetingText }])
  } catch (err) {
    payload.logger.error(`[line] failed to send follow greeting: ${String(err)}`)
  }

  const lineUserId = event.source.userId
  if (!lineUserId) return

  try {
    const customer = await findCustomerByLineUserId(payload, lineUserId)
    if (customer && customer.lineChannelDead) {
      await payload.update({
        collection: 'customers',
        id: customer.id,
        data: { lineChannelDead: false },
      })
    }
  } catch (err) {
    payload.logger.error(`[line] failed to reset lineChannelDead on follow: ${String(err)}`)
  }
}

/**
 * Handles an `unfollow` event (user blocked the OA). Per LINE's docs, a
 * blocked push still returns HTTP 200 with silent non-delivery — this
 * webhook event is the ONLY reliable signal of a block
 * (docs/STEP2-LINE-CATALOGUE.md Part 0.5). Flips `lineChannelDead` so a
 * later notification-channel implementation (Part 3, not built here) can
 * fail over to email automatically. No-op if this userId isn't linked to
 * any customer yet — expected before Part 2's LIFF linking ships.
 */
export async function handleUnfollowEvent(payload: Payload, event: LineUnfollowEvent): Promise<void> {
  const lineUserId = event.source.userId
  if (!lineUserId) return

  try {
    const customer = await findCustomerByLineUserId(payload, lineUserId)
    if (customer && !customer.lineChannelDead) {
      await payload.update({
        collection: 'customers',
        id: customer.id,
        data: { lineChannelDead: true },
      })
    }
  } catch (err) {
    payload.logger.error(`[line] failed to set lineChannelDead on unfollow: ${String(err)}`)
  }
}
