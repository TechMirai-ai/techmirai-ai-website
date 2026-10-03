import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../fields/ai-visible'
import { slugField } from '../fields/slug'

export const TeamCollection: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Team Member', plural: 'Team Members' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'title', 'featured', 'sortOrder'] },
  hooks: { afterChange: [() => { revalidateTag('team') }, () => { revalidateTag('search-index') }] },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'richText', localized: true },
    slugField,
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show when TeamGrid has no explicit member list',
      },
    },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
