import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { GlobalConfig } from 'payload'

export const SEODefaultsGlobal: GlobalConfig = {
  slug: 'seo-defaults',
  label: 'SEO Defaults',
  hooks: { afterChange: [() => { revalidateTag('seo') }] },
  admin: {
    description: 'Default metadata used when a page has no custom SEO fields set',
  },
  fields: [
    { name: 'titleTemplate', type: 'text', localized: true, admin: { description: 'Use %s as page title placeholder, e.g. "%s | Your Site Name"' } },
    { name: 'defaultDescription', type: 'textarea', localized: true },
    { name: 'defaultOgImage', type: 'upload', relationTo: 'media' },
  ],
}
