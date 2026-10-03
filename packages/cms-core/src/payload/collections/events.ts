import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../fields/ai-visible'
import { slugField } from '../fields/slug'

export const EventsCollection: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'startDate', 'category'] },
  hooks: { afterChange: [() => { revalidateTag('events') }] },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'startDate', type: 'date', required: true },
    { name: 'endDate', type: 'date' },
    { name: 'location', type: 'text', localized: true },
    { name: 'excerpt', type: 'textarea', localized: true },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
    { name: 'category', type: 'text', localized: true },
    { name: 'attachment', type: 'upload', relationTo: 'media' },
    slugField,
    aiVisibleField,
  ],
}
