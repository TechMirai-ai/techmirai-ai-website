import createNextIntlPlugin from 'next-intl/plugin'
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const r2BucketUrl = process.env['NEXT_PUBLIC_R2_PUBLIC_URL']

// A custom R2 domain (e.g. media.example.com) is not covered by the *.r2.dev
// patterns, so next/image would reject every media URL with a 400.
function remotePatternFromUrl(rawUrl: string | undefined) {
  if (!rawUrl) return []
  try {
    const { protocol, hostname, port } = new URL(rawUrl)
    return [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        ...(port ? { port } : {}),
      },
    ]
  } catch {
    return []
  }
}

const nextConfig: NextConfig = {
   experimental: {
    workerThreads: false,
    cpus: 2,
  },
  // Pack-4/L2: /og reads the bundled Noto Sans JP font from disk at runtime
  // (no runtime font fetch), so make sure the file ships with that route.
  outputFileTracingIncludes: {
    '/og': ['./src/lib/seo/fonts/NotoSansJP-Bold.otf'],
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
      ...remotePatternFromUrl(r2BucketUrl),
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

  // 5. Pack-4/L1: old techmirai-ai.com legal pages (Spec §17.2). statusCode 301,
  // not `permanent: true` (which Next sends as 308). Targets are the Japanese
  // (unprefixed) pages; /legal-notice is this repo's path for the Spec's /legal
  // (docs/FINDINGS.md 2026-10-14). Old-site anchor redirects await the old URL list.
  async redirects() {
    return [
      { source: '/legal/privacy.html', destination: '/privacy', statusCode: 301 },
      { source: '/legal/terms.html', destination: '/terms', statusCode: 301 },
      { source: '/legal/tokutei.html', destination: '/legal-notice', statusCode: 301 },
      // Pack-4/M1: the Spec's /legal path → this repo's /legal-notice (Jamal,
      // 2026-10-15). Config redirects run before the locale middleware, so the
      // EN path needs its own entry. Exact sources; /legal/*.html is unaffected.
      { source: '/legal', destination: '/legal-notice', statusCode: 301 },
      { source: '/en/legal', destination: '/en/legal-notice', statusCode: 301 },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig))