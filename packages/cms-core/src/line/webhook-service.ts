import type { Payload } from 'payload'

import { handleFollowEvent, handleUnfollowEvent, type FollowHandlerDeps } from './handlers'
import { lineFollowEventSchema, lineUnfollowEventSchema } from './types'

/**
 * Processes every event in an already-signature-verified webhook payload.
 * Each event is isolated in its own try/catch — one bad or unrecognized
 * event must never stop the rest of the batch, mirroring the cron batch
 * job's per-row isolation (../notifications/send.ts's attemptSend). Event types outside
 * this part's scope (`message`, `postback`, rich menu actions, etc.) are
 * silently skipped, not errors — see docs/STEP2-LINE-CATALOGUE.md Part 4.1
 * step 4 for what this part builds.
 */
export async function processLineWebhookEvents(
  payload: Payload,
  rawEvents: unknown[],
  deps: FollowHandlerDeps,
): Promise<void> {
  for (const rawEvent of rawEvents) {
    try {
      const follow = lineFollowEventSchema.safeParse(rawEvent)
      if (follow.success) {
        await handleFollowEvent(payload, follow.data, deps)
        continue
      }

      const unfollow = lineUnfollowEventSchema.safeParse(rawEvent)
      if (unfollow.success) {
        await handleUnfollowEvent(payload, unfollow.data)
      }
    } catch (err) {
      payload.logger.error(`[line] webhook event processing failed: ${String(err)}`)
    }
  }
}
