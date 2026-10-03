import type { Block } from 'payload'

export const StatsBlockConfig: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats', plural: 'Stats Blocks' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'sectionHeading', type: 'text', localized: true },
    {
      name: 'items',
      type: 'array',
      required: true,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'suffix', type: 'text', localized: true },
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'icon', type: 'text', admin: { description: 'Lucide icon name' } },
      ],
    },
  ],
}
