import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import type { SiteConfig } from '../../schema/site-config'
import { aiVisibleField } from '../fields/ai-visible'
import { slugField } from '../fields/slug'
import { buildAvailableBlocks } from './pages'

export function ServicesCollection(siteConfig: SiteConfig): CollectionConfig {
  return {
    slug: 'services',
    labels: { singular: 'Service', plural: 'Services' },
    admin: { useAsTitle: 'title', defaultColumns: ['title', 'active', 'sort'] },
    hooks: {
      afterChange: [() => { revalidateTag('services') }, () => { revalidateTag('search-index') }],
    },
    fields: [
      { name: 'title', type: 'text', localized: true, required: true },
      { name: 'excerpt', type: 'textarea', localized: true, required: true },
      { name: 'thumbnail', type: 'upload', relationTo: 'media' },
      {
        name: 'icon',
        type: 'text',
        admin: { description: 'Lucide icon name or custom SVG filename in /public/brand/' },
      },
      slugField,
      { name: 'sort', type: 'number', admin: { position: 'sidebar' } },
      { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
      { name: 'body', type: 'richText', localized: true },
      {
        name: 'stats',
        type: 'array',
        fields: [
          { name: 'value', type: 'number', required: true },
          { name: 'suffix', type: 'text' },
          { name: 'label', type: 'text', localized: true, required: true },
          { name: 'icon', type: 'text' },
        ],
      },
      {
        name: 'cta',
        type: 'group',
        fields: [
          { name: 'heading', type: 'text', localized: true },
          { name: 'subheading', type: 'text', localized: true },
          { name: 'buttonLabel', type: 'text', localized: true },
          { name: 'buttonHref', type: 'text' },
        ],
      },
      {
        name: 'layout',
        type: 'blocks',
        blocks: buildAvailableBlocks(siteConfig),
      },
      aiVisibleField,
    ],
  }
}
