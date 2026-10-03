import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

export const GalleryCollection: CollectionConfig = {
  slug: 'gallery',
  labels: { singular: 'Gallery Image', plural: 'Gallery Images' },
  admin: { useAsTitle: 'alt', defaultColumns: ['image', 'alt', 'category', 'sortOrder'] },
  hooks: { afterChange: [() => { revalidateTag('gallery') }] },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'alt', type: 'text', localized: true, required: true },
    { name: 'caption', type: 'text', localized: true },
    { name: 'category', type: 'text', localized: true },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
  ],
}
