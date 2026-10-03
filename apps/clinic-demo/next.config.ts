import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const r2BucketUrl = process.env['NEXT_PUBLIC_R2_PUBLIC_URL']

const nextConfig: NextConfig = {
   experimental: {
    workerThreads: false,
    cpus: 2,
  },
  // 1. Force proper frontend/UI bundling for Payload and its styling dependencies
  transpilePackages: [
    '@techmirai/cms-core',
    '@payloadcms/ui',
    'react-image-crop',
  ],

  // 2. Keep heavyweight database, system utilities, and backend engines externalized
  serverExternalPackages: [
    'payload',
    '@payloadcms/db-postgres',
    '@payloadcms/db-sqlite',
    '@payloadcms/email-resend',
    'sharp',
    'drizzle-orm',
    'drizzle-kit',
    'pg',
    'pino',
    'pino-pretty',
    'better-sqlite3',
  ],

  // 3. Media storage bucket structures
  images: {
  qualities: [75, 80, 100],
  remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
      // 🔌 👈 Added to authorize local media file serving routes through next/image
      { 
        protocol: 'http', 
        hostname: 'localhost', 
        port: '3000', 
        pathname: '/api/media/**' 
      },
    ],
  },

  // 4. Clean frontend fallbacks (Removes the hacky empty-loader logic entirely)
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {}
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config
  },
}

export default withPayload(withNextIntl(nextConfig))