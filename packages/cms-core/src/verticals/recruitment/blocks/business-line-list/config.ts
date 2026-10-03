import type { Block } from 'payload'

export const BusinessLineListBlockConfig: Block = {
  slug: 'business-line-list',
  interfaceName: 'BusinessLineListBlock',
  labels: { singular: 'Business Services List', plural: 'Business Services Lists' },
  fields: [
    { name: 'heading', type: 'text', localized: true, admin: { description: 'Max 100 characters' } },
    { name: 'intro', type: 'textarea', localized: true, admin: { description: 'Max 300 characters' } },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 20,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'imageAlt', type: 'text', localized: true, admin: { description: 'Max 150 characters' } },
        { name: 'icon', type: 'text', admin: { description: 'Icon slug (e.g. Lucide icon name)' } },
        { name: 'eyebrow', type: 'text', localized: true, admin: { description: 'Max 60 characters' } },
        { name: 'title', type: 'text', required: true, localized: true, admin: { description: 'Max 100 characters' } },
        { name: 'description', type: 'richText', required: true, localized: true },
        {
          name: 'features',
          type: 'array',
          maxRows: 10,
          fields: [
            { name: 'text', type: 'text', required: true, localized: true, admin: { description: 'Max 120 characters' } },
          ],
        },
        { name: 'ctaLabel', type: 'text', localized: true, admin: { description: 'Max 60 characters' } },
        { name: 'ctaHref', type: 'text' },
        {
          name: 'imagePosition',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Auto (alternating by index)', value: 'auto' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
      ],
    },
    {
      name: 'displayMode',
      type: 'select',
      defaultValue: 'alternating',
      options: [
        { label: 'Alternating', value: 'alternating' },
        { label: 'Cards grid', value: 'cards' },
        { label: 'List', value: 'list' },
      ],
    },
  ],
}
