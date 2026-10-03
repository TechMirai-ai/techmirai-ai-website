import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { slugField } from '../fields/slug'
import { aiVisibleField } from '../fields/ai-visible'

export const DownloadsCollection: CollectionConfig = {
  slug: 'downloads',
  labels: { singular: 'Download', plural: 'Downloads' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'active'] },
  hooks: { afterChange: [() => { revalidateTag('downloads') }] },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'file', type: 'upload', relationTo: 'media', required: true },
    { name: 'category', type: 'text', localized: true },
    { name: 'meta', type: 'text', localized: true, admin: { description: 'e.g. 12 pages, Excel file, PDF' } },
    slugField,
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
