import { safeRevalidateTag as revalidateTag } from '../../../payload/lib/revalidate'
import type { CollectionConfig } from 'payload'
import { slugField } from '../../../payload/fields/slug'
import { aiVisibleField } from '../../../payload/fields/ai-visible'

export const JobsCollection: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Job Listing', plural: 'Job Listings' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'department', 'employmentType', 'closingDate', 'active'],
  },
  hooks: {
    afterChange: [() => { revalidateTag('recruit') }, () => { revalidateTag('search-index') }],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'department', type: 'text', localized: true },
    { name: 'excerpt', type: 'textarea', localized: true, required: true },
    { name: 'description', type: 'richText', localized: true },
    { name: 'responsibilities', type: 'richText', localized: true },
    {
      name: 'requirements',
      type: 'array',
      fields: [{ name: 'item', type: 'text', localized: true, required: true }],
    },
    {
      name: 'benefits',
      type: 'array',
      fields: [{ name: 'item', type: 'text', localized: true, required: true }],
    },
    { name: 'location', type: 'text', localized: true },
    {
      name: 'employmentType',
      type: 'select',
      options: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Intern', value: 'intern' },
        { label: 'Temporary', value: 'temporary' },
        { label: 'Remote', value: 'remote' },
      ],
    },
    { name: 'salary', type: 'text', localized: true },
    { name: 'salaryMin', type: 'number', admin: { position: 'sidebar' } },
    { name: 'salaryMax', type: 'number', admin: { position: 'sidebar' } },
    { name: 'salaryCurrency', type: 'text', admin: { position: 'sidebar' } },
    { name: 'publishedAt', type: 'date', required: true, admin: { position: 'sidebar' } },
    { name: 'closingDate', type: 'date', admin: { position: 'sidebar' } },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
    slugField,
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
