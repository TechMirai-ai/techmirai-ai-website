import { sql } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

import type { NotificationRecord } from './types'

const DEFAULT_BATCH_LIMIT = 200

interface PoolExecutor {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: Array<Record<string, unknown>> }>
}

/**
 * The cron job's single fetch. Runs on `payload.db.drizzle` — the
 * **pool-level** Drizzle handle (see booking/tx.ts's doc comment
 * distinguishing it from the transaction-scoped session handle) — so it
 * reuses whatever connection pool the caller's Payload instance already
 * opened. It never instantiates a new pool/client, and it is exactly one
 * SELECT regardless of how many rows are due: satisfies "fetch all due
 * notifications in ONE query" literally, not just in spirit.
 *
 * Columns are pre-rendered on the row (see NotificationsCollection) so no
 * joins or per-row relation lookups are needed to build a sendable message.
 */
export async function fetchDueNotifications(
  payload: Payload,
  limit: number = DEFAULT_BATCH_LIMIT,
): Promise<NotificationRecord[]> {
  const db = (payload.db as unknown as { drizzle: PoolExecutor }).drizzle
  const now = new Date().toISOString()

  const result = await db.execute(sql`
    SELECT id, channel, recipient, subject, html, text, dedupe_key AS "dedupeKey", attempts
    FROM notifications
    WHERE status = 'pending' AND scheduled_for <= ${now}
    ORDER BY scheduled_for ASC
    LIMIT ${limit}
  `)

  return result.rows.map((row) => ({
    id: row['id'] as number | string,
    channel: row['channel'] as NotificationRecord['channel'],
    recipient: row['recipient'] as string,
    subject: row['subject'] as string | null,
    html: row['html'] as string | null,
    text: row['text'] as string | null,
    dedupeKey: row['dedupeKey'] as string,
    // `attempts` is a Postgres `numeric` column — node-postgres returns
    // numeric/decimal values as STRINGS on a raw driver read (to avoid float
    // precision loss), unlike Payload's own ORM layer, which this raw query
    // deliberately bypasses (see the file doc comment). Number() is
    // required here, or `notification.attempts + 1` in send.ts silently
    // becomes string concatenation ("1" + 1 === "11") instead of arithmetic.
    attempts: Number(row['attempts']),
  }))
}
