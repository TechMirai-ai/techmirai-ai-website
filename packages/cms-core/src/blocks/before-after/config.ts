import type { Block } from 'payload'

export const BeforeAfterBlockConfig: Block = {
  slug: 'before-after',
  interfaceName: 'BeforeAfterBlock',
  labels: { singular: 'Before / After Table', plural: 'Before / After Tables' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'sub', type: 'text', localized: true },
    { name: 'beforeLabel', type: 'text', localized: true, required: true, defaultValue: 'Before' },
    { name: 'afterLabel', type: 'text', localized: true, required: true, defaultValue: 'After' },
    {
      name: 'rows',
      type: 'array',
      required: true,
      fields: [
        { name: 'area', type: 'text', localized: true, required: true },
        { name: 'before', type: 'text', localized: true, required: true },
        { name: 'after', type: 'text', localized: true, required: true },
      ],
    },
  ],
}
