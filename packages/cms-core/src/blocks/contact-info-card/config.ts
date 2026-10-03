import type { Block } from 'payload'

export const ContactInfoCardBlockConfig: Block = {
  slug: 'contact-info-card',
  interfaceName: 'ContactInfoCardBlock',
  labels: { singular: 'Contact Info Card', plural: 'Contact Info Cards' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'subheading', type: 'text', localized: true },
    { name: 'address', type: 'textarea', localized: true },
    { name: 'tel', type: 'text' },
    { name: 'fax', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'text' },
    { name: 'officeHours', type: 'textarea', localized: true },
    {
      name: 'links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'url', type: 'text' },
      ],
    },
    { name: 'note', type: 'textarea', localized: true },
  ],
}