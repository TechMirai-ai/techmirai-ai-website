import { z } from 'zod'

/**
 * Webhook event field shapes, verified against
 * https://developers.line.biz/en/reference/messaging-api/ (Webhook event
 * objects) rather than written from memory. Only the `follow`/`unfollow`
 * events are modeled strictly — this part's scope (see
 * docs/STEP2-LINE-CATALOGUE.md Part 4.1 step 4). Every other event type
 * (`message`, `postback`, etc.) is intentionally left unhandled and is
 * skipped by the caller, not an error.
 */

export const lineEventSourceSchema = z.object({
  type: z.enum(['user', 'group', 'room']),
  userId: z.string().optional(),
})

const lineBaseEventSchema = z.object({
  mode: z.enum(['active', 'standby']),
  timestamp: z.number(),
  source: lineEventSourceSchema,
  webhookEventId: z.string().optional(),
  deliveryContext: z.object({ isRedelivery: z.boolean() }).optional(),
})

/** `replyToken` is present on a follow event and lets the greeting reply go
 * out for free (no push quota) — see STEP2-LINE-CATALOGUE.md Part 0.4. */
export const lineFollowEventSchema = lineBaseEventSchema.extend({
  type: z.literal('follow'),
  replyToken: z.string(),
})

/** No `replyToken` — LINE gives no inbound message to reply to on a block,
 * confirmed against the reference: unfollow carries no replyToken field. */
export const lineUnfollowEventSchema = lineBaseEventSchema.extend({
  type: z.literal('unfollow'),
})

export type LineFollowEvent = z.infer<typeof lineFollowEventSchema>
export type LineUnfollowEvent = z.infer<typeof lineUnfollowEventSchema>

export const lineWebhookBodySchema = z.object({
  destination: z.string(),
  events: z.array(z.unknown()),
})

export interface LineTextMessage {
  type: 'text'
  text: string
}
