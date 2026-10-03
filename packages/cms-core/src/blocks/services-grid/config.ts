import type { Block } from 'payload'

export const ServicesGridBlockConfig: Block = {
  slug: 'services-grid',
  interfaceName: 'ServicesGridBlock',
  labels: { singular: 'Services Grid', plural: 'Services Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true, required: true },
    { name: 'heading', type: 'text', localized: true, required: true },
    {
      name: 'services',
      type: 'array',
      labels: { singular: 'Service', plural: 'Services' },
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'subheadline', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', localized: true, required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'alternating',
      options: [
        { label: 'Alternating image/text rows (Homepage style)', value: 'alternating' },
        { label: 'Corporate Banner Style (Services page style)', value: 'corporate-banner' },
      ],
    },
  ],
}