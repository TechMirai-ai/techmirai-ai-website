import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The notification integration tests run against a real Postgres, so they must
 * never be able to reach a real mail/LINE provider. They are written with fake
 * dispatchers; this guard fails the build if one starts importing a real
 * channel, constructing the real dispatcher, reading a provider credential, or
 * calling out over the network.
 */
// Resolved from the package root (vitest runs with cwd = packages/cms-core): `import.meta.url`
// is not a file: URL in this jsdom test environment.
const DIR = join(process.cwd(), 'src', 'notifications')

const FORBIDDEN: ReadonlyArray<{ pattern: RegExp; why: string }> = [
  { pattern: /from\s+['"]resend['"]/, why: 'imports the Resend SDK' },
  { pattern: /\bEmailResendChannel\b/, why: 'uses the real email channel' },
  { pattern: /\bLineMessagingChannel\b/, why: 'uses the real LINE channel' },
  { pattern: /\bcreateDispatcher\s*\(/, why: 'constructs the real dispatcher' },
  { pattern: /RESEND_API_KEY|LINE_CHANNEL_ACCESS_TOKEN/, why: 'reads a provider credential' },
  { pattern: /api\.resend\.com|api\.line\.me/, why: 'names a provider endpoint' },
  { pattern: /\bfetch\s*\(/, why: 'makes a network call' },
]

const integrationFiles = readdirSync(DIR).filter((name) => name.endsWith('.integration.test.ts'))

describe('notification integration tests cannot send real email', () => {
  it('finds the integration test files (so this guard cannot pass vacuously)', () => {
    expect(integrationFiles).toEqual(
      expect.arrayContaining(['booking-notifications.integration.test.ts', 'cron-batch.integration.test.ts']),
    )
  })

  it.each(integrationFiles)('%s uses only fake dispatchers', (name) => {
    const source = readFileSync(join(DIR, name), 'utf8')
    for (const { pattern, why } of FORBIDDEN) {
      expect(pattern.test(source), `${name} ${why}`).toBe(false)
    }
  })
})
