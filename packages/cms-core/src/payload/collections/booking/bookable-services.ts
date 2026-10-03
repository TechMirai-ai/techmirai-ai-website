import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '../../access'

/**
 * Bookable service catalog for the reservation engine.
 *
 * Distinct from the marketing `services` collection (which drives content
 * pages). This collection models a schedulable service: how long it takes,
 * what it costs, and whether first-time visitors may book it.
 *
 * Field names are camelCase (house convention); Payload emits snake_case
 * columns (duration_min, price_yen, first_visit_allowed, sort_order).
 */
export const BookableServicesCollection: CollectionConfig = {
  slug: 'bookable-services',
  labels: { singular: 'Bookable Service', plural: 'Bookable Services' },
  access: { read: authenticated, create: adminOnly, update: adminOnly },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'durationMin', 'priceYen', 'active', 'sortOrder'],
    group: 'Booking',
  },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    {
      name: 'durationMin',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: 'Appointment length in minutes' },
    },
    {
      name: 'priceYen',
      type: 'number',
      min: 0,
      admin: { description: 'Price in JPY. Leave empty for services with no fixed price.' },
    },
    { name: 'firstVisitAllowed', type: 'checkbox', defaultValue: true },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
  ],
}
