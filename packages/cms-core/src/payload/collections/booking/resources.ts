import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '../../access'

/**
 * A bookable resource: a practitioner, a room, or a chair. Slots reference
 * exactly one resource, so capacity is reasoned about per resource.
 */
export const ResourcesCollection: CollectionConfig = {
  slug: 'resources',
  labels: { singular: 'Resource', plural: 'Resources' },
  access: { read: authenticated, create: adminOnly, update: adminOnly },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'active', 'sortOrder'],
    group: 'Booking',
  },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Practitioner', value: 'practitioner' },
        { label: 'Room', value: 'room' },
        { label: 'Chair', value: 'chair' },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
  ],
}
