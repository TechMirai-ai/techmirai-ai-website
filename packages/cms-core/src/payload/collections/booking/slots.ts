import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '../../access'

/**
 * A schedulable time window on a single resource, with finite capacity.
 *
 * `bookedCount` is mutated only by the atomic reservation engine
 * (see src/booking/create-booking.ts) via a conditional UPDATE that guards
 * `booked_count < capacity AND status = 'open'`. The composite index
 * slots(resource_id, starts_at) and the partial index on open slots are
 * created in the accompanying Payload migration (field config cannot express
 * a compound or partial index).
 */
export const SlotsCollection: CollectionConfig = {
  slug: 'slots',
  labels: { singular: 'Slot', plural: 'Slots' },
  access: { read: authenticated, create: adminOnly, update: adminOnly },
  admin: {
    useAsTitle: 'startsAt',
    defaultColumns: ['resource', 'startsAt', 'capacity', 'bookedCount', 'status'],
    group: 'Booking',
  },
  fields: [
    {
      // Not individually indexed: the composite index slots(resource_id,
      // starts_at) from the booking-indexes migration serves resource-scoped
      // lookups, and Postgres does not auto-index foreign keys.
      name: 'resource',
      type: 'relationship',
      relationTo: 'resources',
      required: true,
    },
    {
      // Indexed by the partial index slots(starts_at) WHERE status='open' and
      // the composite index — see the booking-indexes migration.
      name: 'startsAt',
      type: 'date',
      required: true,
    },
    { name: 'endsAt', type: 'date', required: true },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
      admin: { description: 'Maximum simultaneous bookings for this slot' },
    },
    {
      name: 'bookedCount',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
      // Written only by the engine via raw SQL (which bypasses field access).
      // Block create/update through REST/GraphQL so capacity cannot be forged;
      // admin.readOnly alone only disables the Admin UI input, not API writes.
      access: { create: () => false, update: () => false },
      admin: {
        readOnly: true,
        description: 'Managed by the reservation engine. Do not edit by hand.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Blocked', value: 'blocked' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
