import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../fields/ai-visible'
import { slugField } from '../fields/slug'

export const NewsCollection: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News Article', plural: 'News Articles' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'publishedAt', 'slug'] },
  hooks: { afterChange: [() => { revalidateTag('news') }, () => { revalidateTag('search-index') }] },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'excerpt', type: 'textarea', localized: true },
    { name: 'content', type: 'richText', localized: true },
    { name: 'thumbnail', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'additionalImages',
      type: 'array',
      label: 'Additional Images',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    { name: 'category', type: 'text', localized: true },
   { 
      name: 'publishedAt', 
      type: 'date', 
      admin: { position: 'sidebar' },
      defaultValue: () => new Date(), 
    },
    slugField,
    aiVisibleField,
  ],
}
