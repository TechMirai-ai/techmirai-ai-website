import type { Block } from 'payload'

export const HoursLocationBlockConfig: Block = {
  slug: 'hours-location',
  interfaceName: 'HoursLocationBlock',
  labels: { singular: 'Hours & Location', plural: 'Hours & Location Blocks' },
  fields: [
    { name: 'sectionHeading', type: 'text', localized: true },
    {
      name: 'showMap',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Requires contact.mapEmbedUrl in site.config' },
    },
    {
      name: 'showHours',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Requires contact.businessHours in site.config' },
    },
    {
      name: 'showAddress',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Requires contact.address in site.config' },
    },
    {
      name: 'showPhone',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Requires contact.phone in site.config' },
    },
  ],
}
