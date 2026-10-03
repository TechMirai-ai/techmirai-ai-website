import type { Block } from 'payload'

export const HistoryBlockConfig: Block = {
  slug: 'history',
  interfaceName: 'HistoryBlock',
  labels: { singular: 'Company History Timeline', plural: 'Company History Timelines' },
  fields: [
    { name: 'heading', type: 'text', localized: true, admin: { description: 'Max 100 characters' } },
    { name: 'intro', type: 'textarea', localized: true, admin: { description: 'Max 300 characters' } },
    {
      name: 'entries',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'year', type: 'text', required: true, admin: { description: '4-digit year, e.g. "2005"' } },
        { name: 'month', type: 'text', admin: { description: 'Month number 1–12, optional' } },
        { name: 'title', type: 'text', required: true, localized: true, admin: { description: 'Max 100 characters' } },
        { name: 'description', type: 'richText', required: true, localized: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'imageAlt', type: 'text', localized: true, admin: { description: 'Max 150 characters' } },
        { name: 'badge', type: 'text', localized: true, admin: { description: 'Max 40 characters, e.g. "Founded" / "設立"' } },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'alternating',
      options: [
        { label: 'Alternating (desktop left/right)', value: 'alternating' },
        { label: 'Left-aligned', value: 'left' },
        { label: 'Right-aligned', value: 'right' },
      ],
    },
    {
      name: 'accentColor',
      type: 'select',
      defaultValue: 'brand',
      options: [
        { label: 'Brand', value: 'brand' },
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
      ],
    },
  ],
}
