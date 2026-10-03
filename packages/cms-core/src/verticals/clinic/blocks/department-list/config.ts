import type { Block } from 'payload'

// Departments are represented by the shared `services` collection (see
// packages/cms-core/src/payload/collections/services.ts) rather than a
// duplicate collection — see docs/adr note in Doctors/Treatments collections.
export const DepartmentListBlockConfig: Block = {
  slug: 'department-list',
  interfaceName: 'DepartmentListBlock',
  labels: { singular: 'Department List', plural: 'Department Lists' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'subheadline', type: 'textarea', localized: true, admin: { description: 'Short paragraph under the heading' } },
    {
      name: 'departments',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: { description: 'Select which Services collection entries (departments) to display, in order' },
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
      ],
    },
  ],
}
