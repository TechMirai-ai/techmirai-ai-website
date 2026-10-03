import type { Block } from 'payload'

export const GalleryBlockConfig: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    { name: 'sectionHeading', type: 'text', localized: true },
    {
      name: 'categories',
      type: 'array',
      fields: [{ name: 'slug', type: 'text', required: true }],
      admin: { description: 'Filter pills — empty shows all' },
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
    { name: 'lightbox', type: 'checkbox', defaultValue: true },
  ],
}
