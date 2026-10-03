import type { Block } from 'payload'

export const GalleryGridBlockConfig: Block = {
  slug: 'gallery-grid',
  interfaceName: 'GalleryGridBlock',
  labels: { singular: 'Photo Gallery Grid', plural: 'Photo Gallery Grids' },
  fields: [
    { name: 'heading', type: 'text', localized: true, admin: { description: 'Max 100 characters' } },
    { name: 'intro', type: 'textarea', localized: true, admin: { description: 'Max 300 characters' } },
    { name: 'showFilter', type: 'checkbox', defaultValue: false },
    {
      name: 'categories',
      type: 'array',
      maxRows: 10,
      admin: { condition: (data) => !!data['showFilter'] },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true, admin: { description: 'Max 60 characters' } },
        { name: 'slug', type: 'text', required: true, admin: { description: 'URL-safe slug, e.g. "office-events"' } },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'caption', type: 'text', localized: true, admin: { description: 'Max 200 characters' } },
        { name: 'category', type: 'text', admin: { description: 'Must match a category slug above' } },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
    },
    { name: 'enableLightbox', type: 'checkbox', defaultValue: true },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: 'square',
      options: [
        { label: 'Square (1:1)', value: 'square' },
        { label: '4:3', value: '4:3' },
        { label: '3:2', value: '3:2' },
        { label: 'Auto', value: 'auto' },
      ],
    },
  ],
}
