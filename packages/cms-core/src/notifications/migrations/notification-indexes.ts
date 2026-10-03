import { sql } from '@payloadcms/db-postgres/drizzle'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * A partial index serving the cron batch job's single hot-path query:
 * `WHERE status = 'pending' AND scheduled_for <= now()`. Payload's
 * field-level `index: true` on `scheduledFor` covers single-column lookups;
 * this partial index keeps the "find everything due" scan cheap even as
 * `sent`/`failed` rows accumulate, since only `pending` rows are indexed.
 *
 * Statements are idempotent so this can run after a Drizzle `push` or as a
 * Payload migration — mirrors booking/migrations/booking-indexes.ts.
 */

export interface DdlExecutor {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>
}

export async function applyNotificationIndexes(db: DdlExecutor): Promise<void> {
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS notifications_due_idx ON notifications (scheduled_for) WHERE status = 'pending'`,
  )
}

export async function dropNotificationIndexes(db: DdlExecutor): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS notifications_due_idx`)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await applyNotificationIndexes(db as unknown as DdlExecutor)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropNotificationIndexes(db as unknown as DdlExecutor)
}
