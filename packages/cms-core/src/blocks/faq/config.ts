import type { Block } from 'payload'

export const FAQBlockConfig: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ', plural: 'FAQ Blocks' },
  fields: [
    { name: 'sectionHeading', type: 'text', localized: true },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'accordion',
      options: [
        { label: 'Accordion', value: 'accordion' },
        { label: 'Grid', value: 'grid' },
      ],
    },
  ],
}
