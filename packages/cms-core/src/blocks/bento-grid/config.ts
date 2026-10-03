import type { Block } from 'payload'

export const BentoGridBlockConfig: Block = {
  slug: 'bento-grid',
  interfaceName: 'BentoGridBlock',
  labels: { singular: 'Bento Grid', plural: 'Bento Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true, required: true },
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'items',
      type: 'array',
      required: true,
      maxRows: 6,
      labels: { singular: 'Reason', plural: 'Reasons' },
      fields: [
        {
          name: 'number',
          type: 'text',
          admin: { description: 'e.g. "01" — auto-generated if left empty' },
        },
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'icon', type: 'text', admin: { description: 'Lucide icon name (optional)' } },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'asymmetric',
      options: [
        { label: 'Asymmetric bento (recommended for 5 items)', value: 'asymmetric' },
        { label: 'Standard 3-column grid', value: 'standard' },
      ],
    },
  ],
}
