import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '../../access'

/**
 * A reservation against a slot.
 *
 * Two invariants are enforced by DATABASE constraints, not application code:
 *  - `idempotencyKey` is UNIQUE — a retried booking request never creates a
 *    second appointment (the engine catches the unique violation and returns
 *    the original).
 *  - `confirmationCode` is UNIQUE — the customer-facing code is collision-free.
 *
 * The unique field config below makes Payload emit those UNIQUE indexes; the
 * migration re-asserts them plus the scheduled_at / customer_id indexes.
 */
export const AppointmentsCollection: CollectionConfig = {
  slug: 'appointments',
  labels: { singular: 'Appointment', plural: 'Appointments' },
  // Appointments are created and transitioned only by the reservation engine
  // (Local API, which bypasses access). Block direct REST/GraphQL writes so the
  // engine's invariants cannot be circumvented.
  access: { read: authenticated, create: adminOnly, update: adminOnly },
  admin: {
    useAsTitle: 'confirmationCode',
    defaultColumns: ['confirmationCode', 'status', 'scheduledAt', 'visitType'],
    group: 'Booking',
  },
  fields: [
    { name: 'slot', type: 'relationship', relationTo: 'slots', required: true },
    { name: 'customer', type: 'relationship', relationTo: 'customers', required: true, index: true },
    { name: 'service', type: 'relationship', relationTo: 'bookable-services', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'booked',
      options: [
        { label: 'Booked', value: 'booked' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Checked In', value: 'checked_in' },
        { label: 'Done', value: 'done' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'No Show', value: 'no_show' },
        // Transient: held only for the duration of a single /reschedule
        // attempt (claimed atomically from 'booked', see reschedule.ts),
        // then either flipped to 'cancelled' on success or reverted to
        // 'booked' on failure. Prevents two concurrent reschedule requests
        // for the same appointment from both succeeding.
        { label: 'Rescheduling', value: 'rescheduling' },
      ],
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar' },
    },
    {
      name: 'visitType',
      type: 'select',
      required: true,
      options: [
        { label: 'First Visit', value: 'first' },
        { label: 'Return Visit', value: 'return' },
      ],
    },
    { name: 'scheduledAt', type: 'date', required: true, index: true },
    {
      name: 'confirmationCode',
      type: 'text',
      required: true,
      unique: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'accessTokenHash',
      type: 'text',
      access: { create: () => false, update: () => false },
      admin: { readOnly: true },
    },
    {
      // WO-5: a second, purpose-specific credential for the customer's
      // "manage your appointment" link (on-screen and emailed), distinct
      // from accessTokenHash — never the raw, non-expiring access_token
      // itself in a clickable email URL. See tokens.ts's deriveLinkToken.
      name: 'manageLinkTokenHash',
      type: 'text',
      access: { create: () => false, update: () => false },
      admin: { readOnly: true },
    },
    {
      // Bounds a leaked/forwarded email link's blast radius — unlike
      // accessTokenHash, this credential is meant to expire.
      name: 'manageLinkTokenExpiresAt',
      type: 'date',
      access: { create: () => false, update: () => false },
      admin: { readOnly: true },
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'system',
      admin: { description: 'Origin of the booking, e.g. web, phone, walk-in' },
    },
  ],
}
