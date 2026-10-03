import { getPayload } from 'payload'
import config from '../payload.config'
import { applyBookingIndexes, applyCustomerLineFields } from '@techmirai/cms-core/booking'
import { applyNotificationIndexes } from '@techmirai/cms-core/notifications'

/**
 * Applies the booking/notification modules' hand-written indexes and
 * constraints (composite/partial indexes, CHECK constraints, FK ON DELETE
 * RESTRICT) that Payload's field config can't express.
 *
 * Interim substitute for `payload migrate`, which currently fails outright
 * in this monorepo (see payload.config.ts's postgresAdapter `prodMigrations`
 * comment for why) — this calls the same idempotent `IF NOT EXISTS` DDL
 * those migrations declare, just via a direct Payload boot instead of the
 * broken CLI. Postgres only; safe to re-run.
 *
 * Run via `pnpm db:apply-indexes`, AFTER the base schema already exists
 * (e.g. a first boot with the adapter's `push` temporarily set to `true` —
 * see docs/DEPLOY-NEW-CLIENT.md's database step).
 */
async function applyIndexes(): Promise<void> {
  const dbUri = process.env['DATABASE_URI'] ?? ''
  if (dbUri.startsWith('file:') || dbUri.endsWith('.db')) {
    console.error(
      '🛑 Refusing to run: DATABASE_URI is local SQLite. These indexes are Postgres-only DDL. Aborting.',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const drizzle = (
    payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
  ).drizzle

  payload.logger.info('Applying booking module indexes/constraints...')
  await applyBookingIndexes(drizzle)
  payload.logger.info('Applying notification module indexes...')
  await applyNotificationIndexes(drizzle)
  payload.logger.info('Applying customer LINE fields...')
  await applyCustomerLineFields(drizzle)
  payload.logger.info('Done.')
  process.exit(0)
}

applyIndexes().catch((err: unknown) => {
  console.error('Applying DB indexes failed:', err)
  process.exit(1)
})
