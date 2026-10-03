import { defineRouting } from 'next-intl/routing'
import type { SiteConfig } from '../schema/site-config'

export function buildRouting(siteConfig: SiteConfig) {
  return defineRouting({
    locales: siteConfig.locales.enabled,
    defaultLocale: siteConfig.locales.default,
    localePrefix: 'as-needed',
  })
}
