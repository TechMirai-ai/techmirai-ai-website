import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../fields/ai-visible'
import { slugField } from '../fields/slug'

export const BlogCollection: CollectionConfig = {
  slug: 'blog',
  labels: { singular: 'Blog Post', plural: 'Blog Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'active'],
    preview: (doc) => {
      const base = process.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000'
      return `${base}/blog/${String(doc['slug'] ?? '')}`
    },
  },
  hooks: {
    afterChange: [() => { revalidateTag('blog') }, () => { revalidateTag('search-index') }],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'excerpt', type: 'textarea', localized: true },
    { name: 'content', type: 'richText', localized: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'category', type: 'text', localized: true },
    {
      name: 'author',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'jobTitle', type: 'text', localized: true },
      ],
    },
    { name: 'readTime', type: 'number', admin: { description: 'Estimated read time in minutes', position: 'sidebar' } },
    { name: 'publishedAt', type: 'date', required: true, admin: { position: 'sidebar' } },
    slugField,
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
