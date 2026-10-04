import { buildConfig } from 'payload'
import { buildCmsConfig } from '@techmirai/cms-core/payload/config-factory'
import { bookingIndexesUp, bookingIndexesDown, customerLineFieldsUp, customerLineFieldsDown } from '@techmirai/cms-core/booking'
import { notificationIndexesUp, notificationIndexesDown } from '@techmirai/cms-core/notifications'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { s3Storage } from '@payloadcms/storage-s3'
import siteConfig from './site.config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uri = process.env['DATABASE_URI']

if (!uri) {
  throw new Error('[payload] DATABASE_URI is required. Set it in .env.local.')
}

const db =
  uri.startsWith('file:') || uri.endsWith('.db')
    ? sqliteAdapter({ client: { url: uri } })
    : postgresAdapter({
      pool: {
          connectionString: uri,
          max: 10,
          idleTimeoutMillis: 45000,
          connectionTimeoutMillis: 45000,
          ssl: uri.includes('rlwy.net') ? { rejectUnauthorized: false } : true,
        },
         push: true,
        // Booking module indexes + constraints that field config can't express.
        // Runs on production init so the DB-level safety net actually deploys.
        //
        // KNOWN GAP (tracked, due before WO-8 production go-live): the bundled
        // `payload migrate`/`migrate:status` CLI currently fails outright in
        // this monorepo — it internally pins an older tsx that can't resolve
        // this file's cross-package extensionless imports (e.g.
        // config-factory.ts's `../schema/site-config`). No `migrations/`
        // directory has ever been generated here as a result. Confirmed
        // working alternative for one-off DDL: boot Payload directly via
        // `NODE_OPTIONS="--require ./fix-next-env-interop.cjs" ./node_modules/.bin/tsx
        // --env-file=.env.local <script>` (the same invocation apps/clinic-demo's
        // own `seed`/`seed:demo` scripts use) and call `applyBookingIndexes()`
        // (exported from `@techmirai/cms-core/booking`) directly — that's
        // idempotent, additive-only DDL with no interactive prompt, unlike
        // Payload's generic `payload.migrate()` runner, which also asks for
        // interactive confirmation before reconciling a push-created (dev)
        // schema against migration tracking, warning of possible data loss.
        // There is currently no production-safe automated migration path;
        // this must be fixed before WO-8.
        // prodMigrations: [
        //   { name: 'booking-indexes', up: bookingIndexesUp, down: bookingIndexesDown },
        //   { name: 'notification-indexes', up: notificationIndexesUp, down: notificationIndexesDown },
        //   { name: 'customer-line-fields', up: customerLineFieldsUp, down: customerLineFieldsDown },
        // ],
      })

const baseConfig = buildCmsConfig(siteConfig, undefined, db)

const allowedOrigins = [
  process.env.NEXT_PUBLIC_SERVER_URL,
  `https://www.${siteConfig.site.domain}`,
  `https://${siteConfig.site.domain}`,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[]

const finalConfig = {
  ...baseConfig,
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  cors: allowedOrigins,
  csrf: allowedOrigins,
  admin: {
    ...baseConfig.admin,
    importMap: {
      baseDir: path.resolve(__dirname, './src/app/(payload)'),
    },
    ...(process.env.NODE_ENV === 'development' ? {
      autoLogin: {
        email: 'admin@payloadcms.com',
        password: 'test',
        prefillOnly: true,
      }
    } : {}),
  },
}

// ✅ R2 Storage Configuration
if (
  process.env.CLOUDFLARE_R2_BUCKET &&
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
  process.env.CLOUDFLARE_R2_ENDPOINT
) {
  finalConfig.plugins = [
    ...(finalConfig.plugins || []),
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.CLOUDFLARE_R2_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        },
        region: 'auto',
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      },
    }),
  ]
} else {
  console.log('⚠️ R2 not configured - using local file storage')
}

// ✅ Type-safe check
if ('importMap' in baseConfig) {
  delete (finalConfig as any).importMap
}

finalConfig.upload = {
  ...finalConfig.upload,
}

export default buildConfig(finalConfig)
