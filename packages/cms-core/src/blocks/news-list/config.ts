import type { Block } from 'payload'

export const NewsListBlockConfig: Block = {
  slug: 'news-list',
  interfaceName: 'NewsListBlock',
  labels: { singular: 'News List', plural: 'News Lists' },
  fields: [
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Standard Split List (News Updates Page)', value: 'list' },
        { label: 'Horizontal Slider Card Deck (Home Page)', value: 'carousel' },
      ],
    },
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'From Collection', value: 'collection' },
        { label: 'Inline', value: 'inline' },
      ],
    },
    {
      name: 'count',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'collection',
        description: 'Number of latest news items to display',
      },
    },
    {
      name: 'selectedItems',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'collection',
        description: 'Leave empty to show latest items by publishedAt',
      },
    },
    {
      name: 'inlineItems',
      type: 'array',
      admin: { condition: (_data, siblingData) => siblingData?.source === 'inline', },
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'category', type: 'text', localized: true },
        { name: 'headline', type: 'text', localized: true, required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'viewAllCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text', defaultValue: '/news' },
      ],
    },
  ],

  
}