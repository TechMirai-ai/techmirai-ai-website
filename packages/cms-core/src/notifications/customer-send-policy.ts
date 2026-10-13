import type { Payload } from 'payload'

/**
 * The single, fail-closed policy for customer-facing booking emails
 * (confirmation, reminder, cancellation — including the reschedule
 * confirmation and the LINE copy of each): they are sent ONLY in local
 * development. Production, staging, test, an unset NODE_ENV or any other
 * value withholds them. Every place that can send one must ask this module —
 * the immediate sends in service.ts AND the cron batch — because guarding one
 * customer email type does not guard the others.
 *
 * To go live this must be changed deliberately (and the day-before reminder
 * delivery verified first — see docs/PLACEHOLDER-REGISTER.md J2-09); there is
 * intentionally no environment variable or site-config flag that enables it.
 */

export const CUSTOMER_EMAIL_WITHHELD_REASON =
  'Withheld: customer booking emails are sent only in local development (fail closed)'

/** Only an explicit, exact `development` counts. 'Development', 'test', 'staging', '', and undefined do not. */
export function isLocalDevelopmentEnv(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'development'
}

export function customerEmailsAllowed(config: { isLocalDevelopment: boolean }): boolean {
  return config.isLocalDevelopment === true
}

const STAFF_TEMPLATE_PREFIX = 'staff-'

/**
 * Staff notifications are the only rows that are NOT customer-facing. Anything
 * else — including a row with no template key at all — is treated as
 * customer-facing, so an unknown row can never slip past the guard.
 */
export function isCustomerFacingTemplateKey(templateKey: string | null | undefined): boolean {
  return !(typeof templateKey === 'string' && templateKey.startsWith(STAFF_TEMPLATE_PREFIX))
}

export interface DuePartition<T> {
  toSend: T[]
  withheld: T[]
}

/** Splits the cron's due rows into those that may be sent now and customer rows that must be withheld. */
export function partitionDueNotifications<T extends { templateKey?: string | null | undefined }>(
  due: readonly T[],
  customerEmailsAreAllowed: boolean,
): DuePartition<T> {
  if (customerEmailsAreAllowed) return { toSend: [...due], withheld: [] }
  const toSend: T[] = []
  const withheld: T[] = []
  for (const row of due) {
    ;(isCustomerFacingTemplateKey(row.templateKey) ? withheld : toSend).push(row)
  }
  return { toSend, withheld }
}

/**
 * Records withheld customer rows as 'skipped' with the reason (an audit trail
 * instead of leaving them pending forever). Never throws: a failed write is
 * logged and the row simply stays unsent.
 */
export async function markNotificationsWithheld(
  payload: Payload,
  rows: ReadonlyArray<{ id: number | string }>,
): Promise<void> {
  for (const row of rows) {
    try {
      await payload.update({
        collection: 'notifications',
        id: row.id,
        data: { status: 'skipped', lastError: CUSTOMER_EMAIL_WITHHELD_REASON },
      })
    } catch (err) {
      payload.logger.error(
        `notifications: could not mark withheld notification ${row.id} as skipped: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
}
