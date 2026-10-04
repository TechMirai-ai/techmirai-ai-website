import type { Payload, Where } from 'payload'

// 'home'/'services' are the real site routes now seeded by this demo script
// (see pages/home.ts, pages/services.ts) — they can't carry a 'demo-' prefix
// since the live routes require those exact slugs, so they're listed here by
// exact value instead of relying on the 'demo-' contains match below.
export const DEMO_PAGE_SLUGS = ['home', 'demo-about', 'services', 'faq']

// Collections keyed by their unique `slug` field — demo docs always use a
// `demo-` prefixed slug, so a `contains` match safely isolates them from any
// real content without needing a schema change.
// doctors/treatments reference services (department/specialties) with required
// relationship fields, so they must clear before services or the FK nulling
// Payload does on delete violates their NOT NULL constraint. `treatments` is
// no longer seeded (the real homepage content list has no treatment-list
// section), but stays listed here so docs left behind by an earlier run are
// still cleaned up — and still ahead of `services` for the same FK reason.
const SLUG_TAGGED_COLLECTIONS = ['doctors', 'treatments', 'services', 'faqs', 'news', 'blog', 'downloads', 'team'] as const

/**
 * Second, explicit signal required before anything is deleted.
 *
 * The database guards on the seed script itself (NODE_ENV, CI/Vercel,
 * DATABASE_ENV) decide WHICH database may be touched. This decides whether the
 * destructive step may run at all — so that even a deliberate run of the wrong
 * script, against a correctly-declared dev database, cannot silently wipe
 * content without the operator having said so a second time.
 *
 * Satisfied by either:
 *   - passing `--confirm` on the command line, or
 *   - setting SEED_DEMO_CONFIRM_CLEAR=yes for that one invocation.
 *
 * Deliberately NOT satisfiable from .env.local: this must be typed per run, or
 * it stops being a second signal.
 */
export function assertClearConfirmed(): void {
  const hasFlag = process.argv.slice(2).includes('--confirm')
  const hasEnv = process.env['SEED_DEMO_CONFIRM_CLEAR'] === 'yes'
  if (hasFlag || hasEnv) return

  console.error(
    [
      '🛑 Refusing to run: this seed DELETES existing content before writing.',
      '',
      `   It would clear: pages (${DEMO_PAGE_SLUGS.join(', ')}), every "demo-" slugged doc in`,
      `   ${SLUG_TAGGED_COLLECTIONS.join(', ')}, plus demo testimonials, gallery, events and media.`,
      '',
      '   Re-run it with an explicit confirmation if that is really what you want:',
      '',
      '     pnpm seed:demo --confirm',
      '     # or: SEED_DEMO_CONFIRM_CLEAR=yes pnpm seed:demo',
      '',
      '   Nothing has been changed.',
    ].join('\n'),
  )
  process.exit(1)
}

export interface ClearOptions {
  hasEvents: boolean
  hasGallery: boolean
  hasClinic: boolean
}

async function deleteWhere(payload: Payload, collection: string, where: Where): Promise<number> {
  const found = await payload.find({ collection, where, limit: 1000, depth: 0 })
  let removed = 0
  for (const doc of found.docs) {
    try {
      await payload.delete({ collection, id: doc.id })
      removed++
    } catch (err) {
      // A demo-tagged doc can still be referenced by a required (NOT NULL)
      // relationship on a non-demo-tagged doc elsewhere (e.g. a `news` item's
      // required thumbnail pointing at a "demo-" media file) — deleting it
      // would violate that FK. Skip and warn rather than let one stuck
      // reference abort the whole clear/reseed run; the referencing doc and
      // this doc are both left alone.
      payload.logger.warn(
        `  – ${collection}: could not delete demo doc ${doc.id} (still referenced elsewhere?), skipping: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }
  return removed
}

/**
 * Removes every doc previously created by this demo seed so re-running the
 * script never duplicates content. Pages are cleared first (they may hold
 * relationships to the other collections/media), then the tagged
 * collections, then media last.
 */
export async function clearDemoContent(payload: Payload, options: ClearOptions): Promise<void> {
  payload.logger.info('🧹 Clearing previously seeded demo content...')

  for (const slug of DEMO_PAGE_SLUGS) {
    await deleteWhere(payload, 'pages', { slug: { equals: slug } })
  }

  // doctors/treatments are only registered Payload collections when
  // siteConfig.verticals.clinic is on (see config-factory.ts) — querying an
  // unregistered collection throws, so they're skipped here otherwise.
  const collectionsToClear = options.hasClinic
    ? SLUG_TAGGED_COLLECTIONS
    : SLUG_TAGGED_COLLECTIONS.filter((collection) => collection !== 'doctors' && collection !== 'treatments')

  for (const collection of collectionsToClear) {
    const count = await deleteWhere(payload, collection, { slug: { contains: 'demo-' } })
    if (count) payload.logger.info(`  – ${collection}: removed ${count} demo doc(s)`)
  }

  const testimonialCount = await deleteWhere(payload, 'testimonials', { company: { equals: 'Demo Company Ltd' } })
  if (testimonialCount) payload.logger.info(`  – testimonials: removed ${testimonialCount} demo doc(s)`)

  if (options.hasGallery) {
    const galleryCount = await deleteWhere(payload, 'gallery', { category: { equals: 'demo-gallery' } })
    if (galleryCount) payload.logger.info(`  – gallery: removed ${galleryCount} demo doc(s)`)
  }

  if (options.hasEvents) {
    const eventCount = await deleteWhere(payload, 'events', { slug: { contains: 'demo-' } })
    if (eventCount) payload.logger.info(`  – events: removed ${eventCount} demo doc(s)`)
  }

  const mediaCount = await deleteWhere(payload, 'media', { filename: { contains: 'demo-' } })
  if (mediaCount) payload.logger.info(`  – media: removed ${mediaCount} demo file(s)`)

  payload.logger.info('🧹 Clear complete.\n')
}
