import { getPayload } from 'payload'
import config from '../../../payload.config'
import siteConfig from '../../../site.config'
import { clearDemoContent, assertClearConfirmed } from './lib/clear'
import { seedDemoMedia } from './media'
import { seedDemoServices } from './services'
import { seedDemoFAQs } from './faqs'
import { seedDemoNews } from './news'
import { seedDemoBlog } from './blog'
import { seedDemoTestimonials } from './testimonials'
import { seedDemoDownloads } from './downloads'
import { seedDemoTeam } from './team'
import { seedDemoEvents } from './events'
import { seedDemoGallery } from './gallery'
import { seedDemoDoctors } from './doctors'
import { seedDemoHomePage } from './pages/home'
import { seedDemoAboutPage } from './pages/about'
import { seedDemoServicesPage } from './pages/services'
import { seedDemoFAQPage } from './pages/faq'
import { seedDemoFooter } from './footer'
import { seedDemoHeader } from './globals-header'

/**
 * Content seed for this app, run ONLY via an explicit `pnpm seed:demo`.
 * Separate from src/seed/index.ts (`pnpm seed`).
 *
 * It must never be reachable from an npm lifecycle hook, a CI job, or a build
 * step — see README.md "Demo Seed". The guards below are the second line of
 * defence behind that:
 *   1. never in a production build,
 *   2. never in CI / on a Vercel builder,
 *   3. only against a database explicitly declared as a dev database,
 *   4. and the destructive clear step needs its own separate confirmation
 *      (assertClearConfirmed, below).
 */
async function seedDemo(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production' || process.env['NEXT_PHASE'] === 'phase-production-build') {
    console.log('⏭️ Skipping demo seed in production build')
    return
  }

  // No automated environment has any business running this script. Even though
  // nothing in this repo wires the seed into a lifecycle hook or workflow (see
  // the audit in README.md), refuse outright if we find ourselves inside one —
  // that way a future postinstall/CI step added by accident can't silently
  // wipe content before anyone notices the wiring.
  const automatedEnvVar = (['CI', 'VERCEL', 'GITHUB_ACTIONS', 'NETLIFY'] as const).find(
    (name) => process.env[name],
  )
  if (automatedEnvVar) {
    console.error(
      `🛑 Refusing to run: ${automatedEnvVar} is set, so this looks like an automated build/CI environment. ` +
        'pnpm seed:demo is a hands-on developer command and must never run as part of an install, build, or ' +
        'deploy. Aborting.',
    )
    process.exit(1)
  }

  // SQLite-vs-Postgres is no longer a usable dev/prod signal now that Neon
  // Postgres is the standing dev database (SQLite is retired as an option).
  // Instead, require an explicit, persistent declaration that DATABASE_URI
  // points at a dev database — set once via DATABASE_ENV=development in
  // .env.local, not typed per invocation — and refuse by default otherwise,
  // so a real production DATABASE_URI (which would never carry this flag)
  // still can't be seeded by accident.
  const isDevDatabase = process.env['DATABASE_ENV'] === 'development'
  if (!isDevDatabase) {
    console.error(
      `🛑 Refusing to run: DATABASE_ENV is not set to "development" (got "${process.env['DATABASE_ENV'] ?? '<unset>'}"). ` +
        'pnpm seed:demo only runs against a database explicitly declared as a dev database via ' +
        'DATABASE_ENV=development in .env.local — it will never run without that declaration, to avoid ever ' +
        'touching production. Aborting.',
    )
    process.exit(1)
  }

  // Checked before Payload is even initialised, so an unconfirmed run costs
  // nothing and touches nothing.
  assertClearConfirmed()

  const payload = await getPayload({ config })
  payload.logger.info(`🌱 Seeding content into ${process.env['DATABASE_URI'] ?? ''}...\n`)

  const hasGallery = siteConfig.features.gallery
  const hasEvents = siteConfig.features.events

  await clearDemoContent(payload, { hasEvents, hasGallery })

  const media = await seedDemoMedia(payload, { hasGallery, hasEvents })

  // Departments (the shared `services` collection) must exist before doctors,
  // whose `specialties` reference them.
  const departmentIds = await seedDemoServices(payload)
  const doctorIds = await seedDemoDoctors(payload, departmentIds)
  const faqIds = await seedDemoFAQs(payload)
  await seedDemoNews(payload, media.news)
  const blogIds = await seedDemoBlog(payload, media.blog)
  await seedDemoTestimonials(payload, media.testimonials)
  const downloadIds = await seedDemoDownloads(payload, media.downloads)
  await seedDemoTeam(payload)

  if (hasGallery) {
    await seedDemoGallery(payload, media.gallery)
  } else {
    payload.logger.info('⏭️  Skipping gallery collection — siteConfig.features.gallery is disabled for this site')
  }

  if (hasEvents) {
    await seedDemoEvents(payload, media.events)
  } else {
    payload.logger.info('⏭️  Skipping events collection — siteConfig.features.events is disabled for this site')
  }

  await seedDemoHomePage(payload, doctorIds, departmentIds)
  await seedDemoAboutPage(payload, media)
  await seedDemoServicesPage(payload, media, faqIds)
  await seedDemoFAQPage(payload, faqIds)
  await seedDemoHeader(payload)
  await seedDemoFooter(payload)

  // blogIds/downloadIds are seeded for their own routes (/blog, /downloads);
  // the homepage no longer references them — the real homepage content list
  // has no blog-teaser or downloads-grid section.
  void blogIds
  void downloadIds

  payload.logger.info('\n✅ Seed complete.')
  payload.logger.info('   Live site: / (home), /services, /contact, /faq — also under /en/...')
  payload.logger.info('   Secondary preview page: /demo-about')
  process.exit(0)
}

seedDemo().catch((err: unknown) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
