import type { MetadataRoute } from 'next'
import siteConfig from '../../site.config'

export default function robots(): MetadataRoute.Robots {
  const serverUrl = process.env['NEXT_PUBLIC_SERVER_URL'] ?? ''
  const isProduction =
    process.env['NODE_ENV'] === 'production' && serverUrl.includes(siteConfig.site.domain)

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
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `https://${siteConfig.site.domain}/sitemap.xml`,
  }
}
