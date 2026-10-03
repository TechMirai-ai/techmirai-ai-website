import type { NotificationChannel, NotificationChannelId, NotificationDispatcher, OutboundMessage } from './types'

/**
 * Builds the single channel-agnostic entry point every call site (immediate
 * send after a booking, the cron batch job) depends on. Adding LINE/SMS
 * later means writing one `NotificationChannel` and passing it in here at
 * the composition root — this function and every caller stay unchanged.
 */
export function createDispatcher(channels: NotificationChannel[]): NotificationDispatcher {
  const registry = new Map<NotificationChannelId, NotificationChannel>(channels.map((channel) => [channel.id, channel]))

  return {
    async send(channel: NotificationChannelId, message: OutboundMessage) {
      const impl = registry.get(channel)
      if (!impl) {
        throw new Error(`No notification channel registered for "${channel}"`)
      }
      return impl.send(message)
    },
  }
}
