process.env['PAYLOAD_MIGRATING'] = 'true'

import { sql } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'
import config from '../payload.config'
import { applyFaqKeywordsCategory } from '@techmirai/cms-core/payload/collections/migrations/faq-keywords-category'

/**
 * One-off, explicit replacement for the interactive `push: true` prompt that
 * hangs on this specific FAQ schema change (see faq-keywords-category.ts
 * and docs/ENGINE-FIXES.md, 2026-10-06 entries). Setting
 * `PAYLOAD_MIGRATING=true` before booting Payload skips `pushDevSchema`
 * entirely (see @payloadcms/db-postgres's connect.js), so this never hits
 * that prompt.
 *
 * NOT safe to re-run casually against a database holding real FAQ content:
 * it drops faqs_locales.category. Run once, manually, with a human
 * watching the output — see docs/ENGINE-FIXES.md for why this data is
 * currently disposable.
 *
 * Run via: pnpm --filter techmirai-web run db:migrate-faq-keywords-category
 */
async function run(): Promise<void> {
  const dbUri = process.env['DATABASE_URI'] ?? ''
  if (dbUri.startsWith('file:') || dbUri.endsWith('.db')) {
    console.error(
      'Refusing to run: DATABASE_URI is local SQLite. This migration is Postgres-only DDL. Aborting.',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const drizzle = (
    payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
  ).drizzle

  const existingCategories = await drizzle.execute(
    sql`SELECT _parent_id, _locale, category FROM faqs_locales ORDER BY _parent_id, _locale`,
  )
  payload.logger.info(
    `faqs_locales.category values before drop: ${JSON.stringify(existingCategories)}`,
  )

  payload.logger.info('Applying FAQ keywords/category migration...')
  await applyFaqKeywordsCategory(drizzle)
  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((err: unknown) => {
  console.error('FAQ schema migration failed:', err)
  process.exit(1)
})
