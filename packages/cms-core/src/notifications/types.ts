export type NotificationChannelId = 'email' | 'line' | 'sms'

/**
 * A fully-rendered, ready-to-send message. Deliberately generic across
 * channels: `subject`/`html` are meaningless to LINE/SMS implementations and
 * simply go unused by them, same as any other channel-specific field would.
 */
export interface OutboundMessage {
  to: string
  subject?: string
  html?: string
  text?: string
  /** Passed through to the provider's own idempotency mechanism where one exists. */
  dedupeKey?: string
}

export interface ChannelSendResult {
  providerMessageId: string
}

/** One provider implementation for one channel. */
export interface NotificationChannel {
  readonly id: NotificationChannelId
  send(message: OutboundMessage): Promise<ChannelSendResult>
}

/**
 * The channel-agnostic entry point every call site depends on. Adding a new
 * channel (LINE, SMS) means writing one `NotificationChannel` and
 * registering it where the dispatcher is constructed — no change here or at
 * any call site.
 */
export interface NotificationDispatcher {
  send(channel: NotificationChannelId, message: OutboundMessage): Promise<ChannelSendResult>
}

/**
 * The subset of a `notifications` row needed to send it. Content
 * (subject/html/text) is pre-rendered at row-creation time — see
 * NotificationsCollection's doc comment — so this shape is everything
 * `attemptSend`/the cron batch job need, with no further lookups.
 */
export interface NotificationRecord {
  id: number | string
  channel: NotificationChannelId
  recipient: string
  subject?: string | null
  html?: string | null
  text?: string | null
  dedupeKey: string
  attempts: number
}
