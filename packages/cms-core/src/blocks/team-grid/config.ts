import type { Block } from 'payload'

export const TeamGridBlockConfig: Block = {
  slug: 'team-grid',
  interfaceName: 'TeamGridBlock',
  labels: { singular: 'Team Grid', plural: 'Team Grids' },
  fields: [
    { name: 'sectionHeading', type: 'text', localized: true },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'team',
      hasMany: true,
      admin: { description: 'When empty, renders all members marked as featured' },
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
    },
    {
      name: 'showBio',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show full bio (recommended for team index page)' },
    },
  ],
}
