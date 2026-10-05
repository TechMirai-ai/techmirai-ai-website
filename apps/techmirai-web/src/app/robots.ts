import type { MetadataRoute } from 'next'
import siteConfig from '../../site.config'

// Pack-2/D2 indexing guard: SITE_ENV must be exactly "production" to serve a
// crawlable robots.txt. Unset or any other value fails safe to "Disallow: /"
// so a staging/demo deploy is never accidentally indexed.
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env['SITE_ENV'] === 'production'

  if (!isProduction) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/thanks'],
      },
    ],
    sitemap: `https://${siteConfig.site.domain}/sitemap.xml`,
  }
}
