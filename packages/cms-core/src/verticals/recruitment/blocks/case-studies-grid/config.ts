import type { Block } from 'payload'

export const CaseStudiesGridBlockConfig: Block = {
  slug: 'case-studies-grid',
  interfaceName: 'CaseStudiesGridBlock',
  labels: { singular: 'Case Studies Grid', plural: 'Case Studies Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'subheadline', type: 'textarea', localized: true, admin: { description: 'Short paragraph under the heading' } },
    {
      name: 'button',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true, defaultValue: 'View all stories' },
        { name: 'href', type: 'text', admin: { description: 'e.g. /case-studies (locale prefix is added automatically)' } },
      ],
    },
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
      name: 'selectedStudies',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: true,
      maxRows: 6,
      admin: {
         condition: (_data, siblingData) => siblingData?.source === 'collection',
        description: 'Leave empty to show all published case studies (max 6)',
      },
    },
    {
      name: 'inlineStudies',
      type: 'array',
      maxRows: 6,
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'inline',
      },
      fields: [
        { name: 'name', type: 'text', localized: true, required: true },
        { name: 'role', type: 'text', localized: true },
        {
          name: 'metric',
          type: 'group',
          fields: [
            { name: 'value', type: 'text', localized: true },
            { name: 'caption', type: 'text', localized: true },
          ],
        },
        { name: 'challenge', type: 'textarea', localized: true },
        { name: 'solution', type: 'textarea', localized: true },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'challengeLabel', type: 'text', localized: true, defaultValue: 'Challenge', admin: { description: 'Label for the Challenge column (e.g. Challenge / 課題 / চ্যালেঞ্জ)' } },
    { name: 'solutionLabel', type: 'text', localized: true, defaultValue: 'Solution', admin: { description: 'Label for the Solution column (e.g. Solution / 解決策 / সমাধান)' } },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'stacked',
      options: [
        { label: 'Stacked', value: 'stacked' },
        { label: 'Grid (2 columns)', value: 'grid' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
  ],
}
