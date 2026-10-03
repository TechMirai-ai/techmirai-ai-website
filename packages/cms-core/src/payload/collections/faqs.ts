import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { slugField } from '../fields/slug'
import { aiVisibleField } from '../fields/ai-visible'

export const FAQsCollection: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'sortOrder', 'active', 'aiVisible'],
  },
  hooks: {
    afterChange: [() => { revalidateTag('faq') }],
  },
  fields: [
    { name: 'question', type: 'text', localized: true, required: true },
    { name: 'answer', type: 'richText', localized: true },
    {
      name: 'sources',
      type: 'array',
      admin: { description: 'Cite the authoritative source for this answer' },
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'url', type: 'text' },
      ],
    },
    { name: 'category', type: 'text', localized: true },
    {
      name: 'homepage',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show on homepage FAQ block' },
    },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    slugField,
    aiVisibleField,
  ],
}
