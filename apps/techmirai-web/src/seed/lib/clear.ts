import type { Payload, Where } from 'payload'

// Pages seeded by the retired clinic-demo script, cleared by exact slug —
// they can't carry a stable prefix since the live routes require these
// exact slugs.
export const LEGACY_PAGE_SLUGS = ['home', 'demo-about', 'services', 'faq']

// Collections that hold nothing but leftover clinic-demo content as of
// Pack-2/F3 — cleared IN FULL, not by a slug/tag pattern. A pattern match
// (the previous `slug: { contains: 'demo-' } ` approach) was tried before
// and missed rows that were never tagged that way to begin with — e.g. the
// 9 leftover `faqs` documents (see docs/ENGINE-FIXES.md, 2026-10-06 entries)
// use slugs auto-generated from their Japanese/English question text, not a
// 'demo-' prefix, so the old clear step could never actually catch them.
// Since no real TechMirai content exists yet in any of these collections,
// a full clear is both simpler and actually correct.
const LEGACY_COLLECTIONS = [
  'doctors',
  'treatments',
  'services',
  'faqs',
  'news',
  'blog',
  'downloads',
  'team',
] as const

export interface ClearOptions {
  hasEvents: boolean
  hasGallery: boolean
  hasClinic: boolean
}

/**
 * Second, explicit signal required before anything is deleted.
 *
 * The database guards on the seed script itself (NODE_ENV, CI/Vercel,
 * DATABASE_ENV, RUN_SEED) decide WHICH database may be touched. This decides
 * whether the destructive step may run at all — so that even a deliberate
 * run against a correctly-declared dev database cannot silently wipe content
 * without the operator having said so a second time.
 *
 * Satisfied by either:
 *   - passing `--confirm` on the command line, or
 *   - setting SEED_CONFIRM_CLEAR=yes for that one invocation.
 *
 * Deliberately NOT satisfiable from .env.local: this must be typed per run.
 */
export function assertSeedConfirmed(): void {
  const hasFlag = process.argv.slice(2).includes('--confirm')
  const hasEnv = process.env['SEED_CONFIRM_CLEAR'] === 'yes'
  if (hasFlag || hasEnv) return

  console.error(
    [
      '🛑 Refusing to run: this seed DELETES existing content before writing.',
      '',
      `   It would clear: pages (${LEGACY_PAGE_SLUGS.join(', ')}), all of`,
      `   ${LEGACY_COLLECTIONS.join(', ')}, plus testimonials, gallery, events and demo media.`,
      '',
      '   Re-run it with an explicit confirmation if that is really what you want:',
      '',
      '     pnpm seed --confirm',
      '     # or: SEED_CONFIRM_CLEAR=yes pnpm seed',
      '',
      '   Nothing has been changed.',
    ].join('\n'),
  )
  process.exit(1)
}

async function deleteWhere(payload: Payload, collection: string, where: Where): Promise<number> {
  const found = await payload.find({ collection, where, limit: 1000, depth: 0 })
  let removed = 0
  for (const doc of found.docs) {
    try {
      await payload.delete({ collection, id: doc.id })
      removed++
    } catch (err) {
      // A doc can still be referenced by a required (NOT NULL) relationship
      // elsewhere — deleting it would violate that FK. Skip and warn rather
      // than let one stuck reference abort the whole clear/reseed run; see
      // media.ts's upload step for how the orphan-file risk this used to
      // create is now avoided regardless of whether this delete succeeds.
      payload.logger.warn(
        `  – ${collection}: could not delete doc ${doc.id} (still referenced elsewhere?), skipping: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }
  return removed
}

async function deleteAll(payload: Payload, collection: string): Promise<number> {
  return deleteWhere(payload, collection, {})
}

/**
 * Removes every leftover clinic-demo doc so `pnpm seed` never duplicates or
 * mixes stale content with the real seed layout. Pages first (may hold
 * relationships to the other collections/media), then the full-clear
 * collections, then media last.
 */
export async function clearLegacyContent(payload: Payload, options: ClearOptions): Promise<void> {
  payload.logger.info('🧹 Clearing leftover clinic-demo content...')

  for (const slug of LEGACY_PAGE_SLUGS) {
    await deleteWhere(payload, 'pages', { slug: { equals: slug } })
  }

  // doctors/treatments are only registered Payload collections when
  // siteConfig.verticals.clinic is on (see config-factory.ts) — querying an
  // unregistered collection throws, so they're skipped here otherwise.
  const collectionsToClear = options.hasClinic
    ? LEGACY_COLLECTIONS
    : LEGACY_COLLECTIONS.filter((collection) => collection !== 'doctors' && collection !== 'treatments')

  for (const collection of collectionsToClear) {
    const count = await deleteAll(payload, collection)
    if (count) payload.logger.info(`  – ${collection}: removed ${count} doc(s)`)
  }

  const testimonialCount = await deleteAll(payload, 'testimonials')
  if (testimonialCount) payload.logger.info(`  – testimonials: removed ${testimonialCount} doc(s)`)

  if (options.hasGallery) {
    const galleryCount = await deleteAll(payload, 'gallery')
    if (galleryCount) payload.logger.info(`  – gallery: removed ${galleryCount} doc(s)`)
  }

  if (options.hasEvents) {
    const eventCount = await deleteAll(payload, 'events')
    if (eventCount) payload.logger.info(`  – events: removed ${eventCount} doc(s)`)
  }

  const mediaCount = await deleteWhere(payload, 'media', { filename: { contains: 'demo-' } })
  if (mediaCount) payload.logger.info(`  – media: removed ${mediaCount} file(s)`)

  payload.logger.info('🧹 Clear complete.\n')
}
