import type { Block } from 'payload'

export const StatsBarBlockConfig: Block = {
  slug: 'stats-bar',
  interfaceName: 'StatsBarBlock',
  labels: { singular: 'Stats / Pillar Cards Row', plural: 'Stats / Pillar Cards Rows' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 6,
      fields: [
        {
          name: 'value',
          type: 'text',
          admin: { description: 'Max 20 characters, e.g. "17+" or "¥30M". Leave empty for pillar-card style.' },
        },
        { name: 'label', type: 'text', required: true, localized: true, admin: { description: 'Max 60 characters' } },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Max 200 characters. Optional description below the label. Use this for pillar cards that need a sentence instead of just a number.',
          },
        },
        { name: 'icon', type: 'text', admin: { description: 'Lucide icon name (optional)' } },
      ],
    },
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'brand',
      options: [
        { label: 'Brand', value: 'brand' },
        { label: 'White', value: 'White' },
        { label: 'Light', value: 'light' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'row',
      options: [
        { label: 'Row', value: 'row' },
        { label: 'Grid', value: 'grid' },
      ],
    },
  ],
}
