import { safeRevalidateTag as revalidateTag } from '../../../payload/lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../../../payload/fields/ai-visible'
import { slugField } from '../../../payload/fields/slug'

export const CaseStudiesCollection: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'clientName', 'publishedAt', 'active'],
    preview: (doc) => {
      const base = process.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000'
      return `${base}/case-studies/${String(doc['slug'] ?? '')}`
    },
  },
  hooks: {
    afterChange: [() => { revalidateTag('case-studies') }, () => { revalidateTag('search-index') }],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'clientName', type: 'text', localized: true, required: true },
    { name: 'industry', type: 'text', localized: true, required: true },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'challenge', type: 'richText', localized: true },
    { name: 'solution', type: 'richText', localized: true },
    { name: 'outcome', type: 'richText', localized: true },
    { name: 'role', type: 'text', localized: true, admin: { description: 'e.g. HR Director • TechGlobal Inc.' } },
    { name: 'metricValue', type: 'text', localized: true, admin: { description: 'e.g. 100%, 14 Days, 1st' } },
    { name: 'metricCaption', type: 'text', localized: true, admin: { description: 'e.g. Fluency & confidence achieved' } },
    { name: 'photo', type: 'upload', relationTo: 'media', admin: { description: 'Avatar / headshot (distinct from featured image)' } },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'results',
      type: 'array',
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'suffix', type: 'text' },
        { name: 'label', type: 'text', localized: true, required: true },
      ],
    },
    { name: 'publishedAt', type: 'date', required: true },
    slugField,
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
