import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../fields/ai-visible'

export const TestimonialsCollection: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  admin: { useAsTitle: 'adminTitle', defaultColumns: ['adminTitle', 'company', 'rating', 'active'] },
  hooks: { afterChange: [() => { revalidateTag('testimonials') }] },
  fields: [
    { name: 'quote', type: 'textarea', localized: true, required: true },
    {
      name: 'author',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'title', type: 'text', localized: true },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      // Named adminTitle (not authorName) so its column (admin_title)
      // doesn't collide with the author.name group field's column
      // (author_name) — Payload derives group-field columns as
      // `<group>_<field>`, and SQLite tolerated the resulting duplicate
      // insert target silently while Postgres rejects it outright.
      name: 'adminTitle',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ data }) => {
            const author = (data as Record<string, unknown> | undefined)?.['author']
            if (author && typeof author === 'object') {
              return (author as Record<string, unknown>)['name'] ?? ''
            }
            return ''
          },
        ],
      },
    },
    { name: 'company', type: 'text' },
    { name: 'rating', type: 'number', min: 1, max: 5 },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
