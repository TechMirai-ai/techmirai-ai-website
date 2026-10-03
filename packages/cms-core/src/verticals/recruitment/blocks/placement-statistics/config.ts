import type { Block } from 'payload'

export const PlacementStatisticsBlockConfig: Block = {
  slug: 'placement-statistics',
  interfaceName: 'PlacementStatisticsBlock',
  labels: { singular: 'Placement Statistics Charts', plural: 'Placement Statistics Charts' },
  fields: [
    { name: 'heading', type: 'text', localized: true, admin: { description: 'Max 100 characters, e.g. "Success Story"' } },
    { name: 'subtitle', type: 'text', localized: true, admin: { description: 'Max 100 characters, e.g. "Backed by Data". Renders in brand colour.' } },
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Dark', value: 'dark' },
        { label: 'Brand', value: 'brand' },
        { label: 'Light', value: 'light' },
      ],
    },
    {
      name: 'industriesHeading',
      type: 'text',
      localized: true,
      admin: { description: 'Label above the pie chart, e.g. "Placements Across Industries"' },
    },
    {
      name: 'industries',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 20,
      fields: [
        { name: 'name', type: 'text', required: true, localized: true, admin: { description: 'Max 80 characters' } },
        {
          name: 'percentage',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
          admin: { description: '0–100. Values should sum to 100 across all items.' },
        },
      ],
    },
    {
      name: 'regionsHeading',
      type: 'text',
      localized: true,
      admin: { description: 'Label above the bar chart, e.g. "Placements Across Regions"' },
    },
    {
      name: 'regions',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 20,
      fields: [
        { name: 'name', type: 'text', required: true, localized: true, admin: { description: 'Max 60 characters, e.g. "AICHI"' } },
        { name: 'value', type: 'number', required: true, min: 0, admin: { description: 'Numeric count of placements' } },
      ],
    },
  ],
}
