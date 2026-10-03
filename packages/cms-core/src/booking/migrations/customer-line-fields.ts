import { sql } from '@payloadcms/db-postgres/drizzle'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Additive schema change for LINE integration foundation (STEP 2 Part 1,
 * see docs/STEP2-LINE-CATALOGUE.md Part 2 section A):
 *   - customers.line_user_id: nullable, unique — the LINE follow webhook
 *     sets this once a patient links their account. A plain UNIQUE index
 *     permits any number of NULLs (customers with no LINE link), so this
 *     never blocks unrelated inserts.
 *   - customers.line_channel_dead: boolean, defaults false — flipped true by
 *     the unfollow webhook (a blocked OA push returns HTTP 200 with silent
 *     non-delivery, so unfollow is the only reliable block signal; see
 *     STEP2-LINE-CATALOGUE.md Part 0.5). Read by Part 3's notification
 *     dispatcher to fail over to email.
 *
 * Unlike booking-indexes.ts (indexes/constraints layered on pre-existing
 * columns), this ADDS COLUMNS to a table that may already hold production
 * rows — `ADD COLUMN IF NOT EXISTS` with no default-required backfill
 * keeps it purely additive: existing rows simply get NULL/false, no row is
 * rewritten. Mirrors the same pattern otherwise: idempotent, runs after a
 * Drizzle `push` or as a Payload migration, exported both as a plain
 * helper (used in tests) and as Payload up/down functions.
 */

export interface DdlExecutor {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>
}

export async function applyCustomerLineFields(db: DdlExecutor): Promise<void> {
  await db.execute(sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS line_user_id varchar`)
  await db.execute(
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS line_channel_dead boolean DEFAULT false NOT NULL`,
  )
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS customers_line_user_id_idx ON customers (line_user_id)`,
  )
}

export async function dropCustomerLineFields(db: DdlExecutor): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS customers_line_user_id_idx`)
  await db.execute(sql`ALTER TABLE customers DROP COLUMN IF EXISTS line_channel_dead`)
  await db.execute(sql`ALTER TABLE customers DROP COLUMN IF EXISTS line_user_id`)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await applyCustomerLineFields(db as unknown as DdlExecutor)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropCustomerLineFields(db as unknown as DdlExecutor)
}
