/**
 * `pnpm seed` — Pack-2/F3's real (placeholder-content) seed orchestrator,
 * replacing the former stub and the retired `pnpm seed:demo` clinic-demo
 * script. Guarded exactly like the retired demo seed was (see
 * docs/packs/PACK-2-FOUNDATION.md's F3 step 4, "use the existing
 * development-environment guard"), plus one addition: RUN_SEED=true, which
 * this script's own `package.json` entry already sets but which nothing
 * previously checked.
 */
import { getPayload } from 'payload'
import config from '../../payload.config'
import siteConfig from '../../site.config'
import { assertSeedConfirmed, clearLegacyContent } from './lib/clear'
import { seedMedia } from './media'
import { seedHeader, seedFooter } from './globals'
import { seedTeam } from './team'
import { seedCompanyInfoFounder } from './company-info'
import { seedFaqs } from './faqs'
import { seedDownloads } from './downloads'
import { seedPlainPages } from './pages/plain-pages'
import { seedHomePage } from './pages/home'
import { seedCaseStudies } from './case-studies'
import { seedChat } from './chat'
import { seedBlog } from './blog'
import { seedContact } from './contact'
import { seedBooking } from './booking'

async function run(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production' || process.env['NEXT_PHASE'] === 'phase-production-build') {
    console.log('⏭️ Skipping seed in production build')
    return
  }

  const automatedEnvVar = (['CI', 'VERCEL', 'GITHUB_ACTIONS', 'NETLIFY'] as const).find(
    (name) => process.env[name],
  )
  if (automatedEnvVar) {
    console.error(
      `🛑 Refusing to run: ${automatedEnvVar} is set, so this looks like an automated build/CI environment. ` +
        'pnpm seed is a hands-on developer command and must never run as part of an install, build, or deploy. ' +
        'Aborting.',
    )
    process.exit(1)
  }

  if (process.env['RUN_SEED'] !== 'true') {
    console.error(
      '🛑 Refusing to run: RUN_SEED is not "true". Run via `pnpm seed`, which sets this for you. Aborting.',
    )
    process.exit(1)
  }

  const isDevDatabase = process.env['DATABASE_ENV'] === 'development'
  if (!isDevDatabase) {
    console.error(
      `🛑 Refusing to run: DATABASE_ENV is not set to "development" (got "${process.env['DATABASE_ENV'] ?? '<unset>'}"). ` +
        'pnpm seed only runs against a database explicitly declared as a dev database via ' +
        'DATABASE_ENV=development in .env.local. Aborting.',
    )
    process.exit(1)
  }

  // Checked before Payload is even initialised, so an unconfirmed run costs
  // nothing and touches nothing.
  assertSeedConfirmed()

  const payload = await getPayload({ config })
  payload.logger.info('🌱 Seeding content...\n')

  const hasGallery = siteConfig.features.gallery
  const hasEvents = siteConfig.features.events
  const hasClinic = siteConfig.verticals.clinic

  await clearLegacyContent(payload, { hasEvents, hasGallery, hasClinic })

  const media = await seedMedia(payload)
  const team = await seedTeam(payload)
  await seedCompanyInfoFounder(payload, team)
  await seedFaqs(payload)
  const downloads = await seedDownloads(payload)

  await seedPlainPages(payload, media)
  await seedHomePage(payload, media, team, downloads)
  await seedCaseStudies(payload)
  await seedChat(payload)
  await seedBlog(payload)
  await seedContact(payload)
  await seedHeader(payload)
  await seedFooter(payload)
  await seedBooking(payload)

  payload.logger.info('\n✅ Seed complete.')
  payload.logger.info('   Live site: / (home) — also under /en/...')
  process.exit(0)
}

run().catch((err: unknown) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
