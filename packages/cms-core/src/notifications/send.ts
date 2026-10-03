import type { Payload } from 'payload'

import { findCustomerByLineUserId } from '../line/customer-lookup'
import type { NotificationChannelId, NotificationDispatcher, NotificationRecord, OutboundMessage } from './types'

/** Total attempts before a notification is marked permanently `failed`. */
export const MAX_SEND_ATTEMPTS = 3

/**
 * Delay, in minutes, before retrying — indexed by the attempt number that
 * just failed. Only ever consulted for attempts 1 and 2: attempt
 * MAX_SEND_ATTEMPTS (3) always goes to the permanent-failure branch instead,
 * so there is deliberately no 3rd entry here — one would be unreachable.
 */
const BACKOFF_MINUTES: readonly number[] = [1, 5]
const LAST_BACKOFF_MINUTES = BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1] ?? 5

function backoffMinutesFor(attemptNumber: number): number {
  return BACKOFF_MINUTES[attemptNumber - 1] ?? LAST_BACKOFF_MINUTES
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Omits subject/html/text entirely when unset, rather than assigning `undefined` explicitly. */
function toOutboundMessage(notification: NotificationRecord): OutboundMessage {
  return {
    to: notification.recipient,
    dedupeKey: notification.dedupeKey,
    ...(notification.subject ? { subject: notification.subject } : {}),
    ...(notification.html ? { html: notification.html } : {}),
    ...(notification.text ? { text: notification.text } : {}),
  }
}

/**
 * Persists a status update and never throws — a failure to WRITE the
 * outcome is a different failure domain from a failure to SEND, and must
 * not be conflated with it (a transient DB error right after a successful
 * send must not be recorded as a send failure) nor allowed to escape
 * `attemptSend`, which the cron batch loop relies on never throwing.
 */
async function persistOutcome(payload: Payload, id: NotificationRecord['id'], data: Record<string, unknown>): Promise<void> {
  try {
    await payload.update({ collection: 'notifications', id, data })
  } catch (err) {
    payload.logger.error(
      `notifications: failed to persist status update for notification ${id}: ${errorMessage(err)}`,
    )
  }
}

interface EffectiveSend {
  channel: NotificationChannelId
  message: OutboundMessage
  /** True when this differs from the row's queued channel/recipient — the
   * caller uses this to decide whether the persisted outcome needs to
   * record the actually-used channel/recipient, not just the queued one. */
  redirected: boolean
}

interface SkipSend {
  skipReason: string
}

/**
 * A `channel: 'line'` row can go stale between being queued (at booking
 * time, for the day-before reminder) and being sent (by the cron, up to a
 * day later): the customer may have blocked the OA in between, flipping
 * their `lineChannelDead` flag via the unfollow webhook (see
 * ../line/handlers.ts). Per LINE's docs, a push to a blocked user still
 * returns HTTP 200 with silent non-delivery — attemptSend would otherwise
 * mark the row "sent" while the customer never actually receives it, and
 * never fail over to email at all, contradicting customers.ts's own
 * documented promise that "the notification dispatcher reads this to fail
 * over to email." A non-line row (or a still-actively-linked one) is
 * returned unchanged.
 */
async function resolveEffectiveSend(
  payload: Payload,
  notification: NotificationRecord,
): Promise<EffectiveSend | SkipSend> {
  const message = toOutboundMessage(notification)
  const queued: EffectiveSend = { channel: notification.channel, message, redirected: false }

  if (notification.channel !== 'line') {
    return queued
  }

  try {
    const customer = await findCustomerByLineUserId(payload, notification.recipient)
    if (customer?.lineChannelDead) {
      if (customer.email) {
        return { channel: 'email', message: { ...message, to: customer.email }, redirected: true }
      }
      return { skipReason: 'LINE channel is blocked (lineChannelDead) and no email is on file to fall back to' }
    }
  } catch (err) {
    // A lookup failure must not block the primary send attempt — fail open
    // by proceeding with the originally queued channel, same as before this
    // recheck existed.
    payload.logger.warn(
      `notifications: LINE liveness recheck failed for notification ${notification.id}, proceeding with queued channel: ${errorMessage(err)}`,
    )
  }

  return queued
}

/**
 * Attempts to send one notification and always resolves — it never throws,
 * so a single bad send can never abort a caller's loop over many
 * notifications (the cron batch's hard requirement). Every branch ends in a
 * best-effort `persistOutcome()` call recording the outcome.
 *
 * Used identically for an immediate best-effort send right after a booking
 * and for the cron job's retry/catch-up pass over due rows — the cron is
 * what actually re-attempts a row whose first inline try failed.
 */
export async function attemptSend(
  payload: Payload,
  dispatcher: NotificationDispatcher,
  notification: NotificationRecord,
): Promise<void> {
  const attemptNumber = notification.attempts + 1

  const effective = await resolveEffectiveSend(payload, notification)
  if ('skipReason' in effective) {
    await persistOutcome(payload, notification.id, { status: 'skipped', lastError: effective.skipReason })
    return
  }

  // Only the send itself is classified as success/failure — a DB write
  // failure below is handled separately by persistOutcome, never here.
  let sendResult: { providerMessageId: string } | undefined
  let sendError: unknown
  try {
    sendResult = await dispatcher.send(effective.channel, effective.message)
  } catch (err) {
    sendError = err
  }

  if (sendResult) {
    await persistOutcome(payload, notification.id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      providerMessageId: sendResult.providerMessageId,
      attempts: attemptNumber,
      // The row's queued channel/recipient are stale once redirected (e.g.
      // line -> email fallback) — persist what was ACTUALLY used so the
      // channel column stays a truthful, queryable record (item 6).
      ...(effective.redirected ? { channel: effective.channel, recipient: effective.message.to } : {}),
    })
    return
  }

  const message = errorMessage(sendError)

  if (attemptNumber >= MAX_SEND_ATTEMPTS) {
    payload.logger.error(
      `notifications: notification ${notification.id} failed permanently after ${attemptNumber} attempts: ${message}`,
    )
    await persistOutcome(payload, notification.id, { status: 'failed', attempts: attemptNumber, lastError: message })
    return
  }

  const delayMinutes = backoffMinutesFor(attemptNumber)
  payload.logger.warn(
    `notifications: notification ${notification.id} attempt ${attemptNumber} failed, retrying in ${delayMinutes}m: ${message}`,
  )
  await persistOutcome(payload, notification.id, {
    attempts: attemptNumber,
    lastError: message,
    scheduledFor: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
  })
}
