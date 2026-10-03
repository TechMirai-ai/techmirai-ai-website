import type { Block } from 'payload'

export const CompanyProfileBlockConfig: Block = {
  slug: 'company-profile',
  interfaceName: 'CompanyProfileBlock',
  labels: { singular: 'Company Profile', plural: 'Company Profiles' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'inline',
      options: [
        { label: 'Inline (block-level data)', value: 'inline' },
        { label: 'Company Info Global', value: 'global' },
      ],
      admin: {
        description: '"Global" requires a server-side fetch injected at the page level.',
      },
    },
    {
      name: 'inlineProfile',
      type: 'group',
      admin: { condition: (data) => data['source'] !== 'global' },
      fields: [
        { name: 'companyName', type: 'text', localized: true },
        { name: 'founded', type: 'text', localized: true, admin: { description: 'e.g. April 2009' } },
        { name: 'ceo', type: 'text', localized: true },
        { name: 'address', type: 'textarea', localized: true },
        { name: 'capital', type: 'text', localized: true, admin: { description: 'e.g. ¥30,000,000' } },
        { name: 'licenseNumber', type: 'text', localized: true },
        { name: 'headcount', type: 'text', localized: true, admin: { description: 'e.g. 150 employees / 5,000+ registered staff' } },
        { name: 'businessDescription', type: 'textarea', localized: true },
      ],
    },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'photoFallbackText', type: 'text', localized: true },
    {
      name: 'yearsBadge',
      type: 'group',
      fields: [
        { name: 'years', type: 'number', admin: { description: 'Number shown in the badge' } },
        {
          name: 'label',
          type: 'text',
          localized: true,
          admin: { description: 'Use {years} placeholder, e.g. "In business for {years} years"' },
        },
      ],
    },
    {
      name: 'viewFullPageCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text', defaultValue: '/company' },
      ],
    },
  ],
}
