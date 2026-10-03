import type { Block } from 'payload'

export const DoctorGridBlockConfig: Block = {
  slug: 'doctor-grid',
  interfaceName: 'DoctorGridBlock',
  labels: { singular: 'Doctor Grid', plural: 'Doctor Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'subheadline', type: 'textarea', localized: true, admin: { description: 'Short paragraph under the heading' } },
    {
      name: 'doctors',
      type: 'relationship',
      relationTo: 'doctors',
      hasMany: true,
      admin: { description: 'Select which doctors to display, in order' },
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
      admin: { description: 'Show full bio text on each card (recommended off for grids of 4+)' },
    },
  ],
}
