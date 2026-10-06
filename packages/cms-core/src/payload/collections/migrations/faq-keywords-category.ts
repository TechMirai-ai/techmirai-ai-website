import { sql } from '@payloadcms/db-postgres/drizzle'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Interim substitute for `push: true` for this one FAQ schema change only
 * (see docs/ENGINE-FIXES.md, 2026-10-06 entries): `category` leaves
 * `faqs_locales` (moving to a non-localized `enum_faqs_category` column on
 * the base `faqs` table) in the same diff that adds `keywords` to
 * `faqs_locales`. Drizzle's rename-vs-create heuristic can't tell those
 * apart, and the resulting interactive prompt is confirmed
 * interactive-terminal-only — it hangs under automation even when the
 * correct answer is chosen. This applies the same three operations as
 * plain, idempotent DDL instead, so no diff/prompt is ever triggered.
 *
 * NOT purely additive, unlike booking-indexes.ts/customer-line-fields.ts:
 * dropping faqs_locales.category discards whatever is in that column for
 * existing rows. Confirmed safe to run as-is only because the current rows
 * are 9 leftover clinic-demo FAQ documents already slated for removal in
 * Pack-3/F3 (see docs/CLONE-PLAN.md §4) — re-verify row contents before
 * re-running this against any database that might hold real FAQ content.
 */

export interface DdlExecutor {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>
}

export async function applyFaqKeywordsCategory(db: DdlExecutor): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE enum_faqs_category AS ENUM(
        'about-ai-reception', 'accuracy-and-safety', 'setup-and-integration',
        'pricing-and-contract', 'support', 'about-techmirai'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`ALTER TABLE faqs ADD COLUMN IF NOT EXISTS category enum_faqs_category`)
  await db.execute(sql`ALTER TABLE faqs_locales ADD COLUMN IF NOT EXISTS keywords varchar`)
  await db.execute(sql`ALTER TABLE faqs_locales DROP COLUMN IF EXISTS category`)
}

export async function revertFaqKeywordsCategory(db: DdlExecutor): Promise<void> {
  await db.execute(sql`ALTER TABLE faqs_locales ADD COLUMN IF NOT EXISTS category varchar`)
  await db.execute(sql`ALTER TABLE faqs_locales DROP COLUMN IF EXISTS keywords`)
  await db.execute(sql`ALTER TABLE faqs DROP COLUMN IF EXISTS category`)
  await db.execute(sql`DROP TYPE IF EXISTS enum_faqs_category`)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await applyFaqKeywordsCategory(db as unknown as DdlExecutor)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await revertFaqKeywordsCategory(db as unknown as DdlExecutor)
}
