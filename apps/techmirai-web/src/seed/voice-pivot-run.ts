/**
 * `pnpm seed:voice` — writes only the voice-pivot launch pages (/, /demo,
 * /partners, /company), the header and footer. Unlike `pnpm seed` it never
 * clears anything, so it is safe to re-run. It keeps the same database
 * guards as the full seed: development database only, never in CI.
 */
import { getPayload } from 'payload'
import config from '../../payload.config'
import { seedHeader, seedFooter } from './globals'
import { seedVoicePivot } from './pages/voice-pivot'

const AUTOMATED_ENV_VARS = ['CI', 'VERCEL', 'GITHUB_ACTIONS', 'NETLIFY'] as const

function refuse(message: string): never {
  console.error(`🛑 Refusing to run: ${message}`)
  process.exit(1)
}

async function run(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') refuse('NODE_ENV is production.')

  const automated = AUTOMATED_ENV_VARS.find((name) => process.env[name])
  if (automated) refuse(`${automated} is set, so this looks like an automated environment.`)

  if (process.env['RUN_SEED'] !== 'true') refuse('RUN_SEED is not "true". Run via `pnpm seed:voice`.')

  if (process.env['DATABASE_ENV'] !== 'development') {
    refuse('DATABASE_ENV is not "development". This script only runs against a declared dev database.')
  }

  const payload = await getPayload({ config })
  await seedVoicePivot(payload)
  await seedHeader(payload)
  await seedFooter(payload)
  payload.logger.info('✅ Voice-pivot seed complete.')
  process.exit(0)
}

run().catch((err: unknown) => {
  console.error('Voice-pivot seed failed:', err)
  process.exit(1)
})
