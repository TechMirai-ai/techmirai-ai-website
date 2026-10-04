import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
import siteConfig from '../../site.config'

export const routing = defineRouting({
  locales: siteConfig.locales.enabled,
  defaultLocale: siteConfig.locales.default,
  localePrefix: 'as-needed',
  localeDetection: false,   // ← add this line
})

export const { Link, redirect, useRouter, usePathname, getPathname } =
  createNavigation(routing)