import type { Block } from 'payload'

export const RichTextBlockConfig: Block = {
  slug: 'rich-text',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text Blocks' },
  fields: [
    { name: 'content', type: 'richText', localized: true, required: true },
    {
      name: 'maxWidth',
      type: 'select',
      defaultValue: 'prose',
      options: [
        { label: 'Prose (680px)', value: 'prose' },
        { label: 'Wide (1024px)', value: 'wide' },
        { label: 'Full width', value: 'full' },
      ],
    },
  ],
}
