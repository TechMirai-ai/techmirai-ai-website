import type { NotificationChannelId } from './types'

export interface ChannelSelectionCustomer {
  lineUserId?: string | null | undefined
  lineChannelDead?: boolean | null | undefined
  email?: string | null | undefined
}

export interface ResolvedNotificationChannel {
  channel: NotificationChannelId
  recipient: string
}

/**
 * The one place every customer-facing notification call site resolves a
 * channel AND recipient together — added per
 * docs/STEP2-LINE-CATALOGUE.md Part 4.5's recommended refactor, so adding
 * LINE extends a real seam instead of each call site bolting on its own
 * `if (customer.lineUserId)` check. Returning channel and recipient as one
 * unit (rather than letting a caller re-derive recipient from channel with
 * its own `channel === 'line' ? ... : ...`) means there is exactly one
 * place that can ever disagree with itself about which field to read.
 *
 * Rule: LINE if linked and not known-blocked, otherwise email, otherwise
 * (neither usable) no channel at all — the caller is expected to skip and
 * log, exactly as it already does today when email is missing.
 */
export function resolveNotificationChannel(customer: ChannelSelectionCustomer): ResolvedNotificationChannel | null {
  if (customer.lineUserId && customer.lineChannelDead !== true) {
    return { channel: 'line', recipient: customer.lineUserId }
  }
  if (customer.email) {
    return { channel: 'email', recipient: customer.email }
  }
  return null
}
