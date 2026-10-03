import os from 'node:os'
import path from 'node:path'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig, getPayload } from 'payload'
import type { Payload } from 'payload'

import { bookingCollections } from '../../payload/collections/booking'
import { UsersCollection } from '../../payload/collections/users'
import { TEST_DATABASE_URI } from './config'

let payloadPromise: Promise<Payload> | null = null

/**
 * Build (once) a minimal Payload instance containing only the booking
 * collections plus Users, wired to the throwaway test database with schema
 * push enabled. Isolating the booking module from the full CMS keeps these
 * tests fast and independent of unrelated content collections.
 */
export function getTestPayload(): Promise<Payload> {
  if (!payloadPromise) {
    const config = buildConfig({
      secret: 'test-secret-not-for-production',
      db: postgresAdapter({
        pool: { connectionString: TEST_DATABASE_URI, max: 30 },
        push: true,
      }),
      collections: [UsersCollection, ...bookingCollections()],
      editor: lexicalEditor({}),
      localization: {
        locales: [
          { code: 'ja', label: { en: 'JA' } },
          { code: 'en', label: { en: 'EN' } },
        ],
        defaultLocale: 'ja',
        fallback: true,
      },
      typescript: {
        outputFile: path.join(os.tmpdir(), 'booking-test-payload-types.ts'),
      },
    })
    payloadPromise = getPayload({ config })
  }
  return payloadPromise
}
