import type { Block } from 'payload'

export const AffiliatesBlockConfig: Block = {
  slug: 'affiliates',
  interfaceName: 'AffiliatesBlock',
  labels: { singular: 'Partners / Certifications Strip', plural: 'Partners / Certifications Strips' },
  fields: [
    { name: 'heading', type: 'text', localized: true, admin: { description: 'Max 100 characters' } },
    { name: 'body', type: 'textarea', localized: true, admin: { description: 'Max 300 characters' } },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 40,
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'name', type: 'text', required: true, localized: true, admin: { description: 'Max 100 characters' } },
        { name: 'description', type: 'textarea', localized: true, admin: { description: 'Max 300 characters' } },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'cards',
      options: [
        { label: 'Cards', value: 'cards' },
        { label: 'Logos only', value: 'logos' },
        { label: 'List', value: 'list' },
      ],
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
    {
      name: 'animation',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None (static grid)', value: 'none' },
        { label: 'Marquee (logos scroll automatically)', value: 'marquee' },
      ],
      admin: {
        description: 'Marquee applies only when layout is "Logos only". Other layouts are always static.',
      },
    },
  ],
}
