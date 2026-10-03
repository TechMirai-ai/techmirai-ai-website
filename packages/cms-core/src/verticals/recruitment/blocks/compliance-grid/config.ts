import type { Block } from 'payload'

export const ComplianceGridBlockConfig: Block = {
  slug: 'compliance-grid',
  interfaceName: 'ComplianceGridBlock',
  labels: { singular: 'Compliance Grid', plural: 'Compliance Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'licenses',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'issuer', type: 'text', localized: true },
        { name: 'licenseNumber', type: 'text', localized: true },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'shield',
          options: [
            { label: 'Shield', value: 'shield' },
            { label: 'Check', value: 'check' },
            { label: 'Certificate', value: 'certificate' },
            { label: 'Badge', value: 'badge' },
          ],
        },
      ],
    },
    { name: 'commitmentsHeading', type: 'text', localized: true },
    {
      name: 'commitments',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'text', type: 'text', localized: true, required: true },
      ],
    },
  ],
}
