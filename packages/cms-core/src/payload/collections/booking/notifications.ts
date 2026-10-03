import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '../../access'

/**
 * An outbound notification (email today; LINE/SMS later — see
 * src/notifications) tied to an appointment.
 *
 * `subject`/`html`/`text` are rendered ONCE, at row-creation time, when full
 * appointment/customer/service context is already available. This lets the
 * cron batch job fetch and send purely from this table — no joins, no
 * per-row relation lookups at send time.
 *
 * `dedupeKey` is UNIQUE — this is the database-level guarantee that a booking
 * (or its retry) never queues the same notification twice, for customer AND
 * staff notifications alike. Application code must never rely on its own
 * pre-check for this; the constraint is the source of truth.
 */
export const NotificationsCollection: CollectionConfig = {
  slug: 'notifications',
  labels: { singular: 'Notification', plural: 'Notifications' },
  // Rows are only ever written by the notification engine (Local API).
  access: { read: authenticated, create: adminOnly, update: adminOnly },
  admin: {
    useAsTitle: 'dedupeKey',
    defaultColumns: ['templateKey', 'channel', 'status', 'scheduledFor', 'recipient'],
    group: 'Booking',
  },
  fields: [
    { name: 'appointment', type: 'relationship', relationTo: 'appointments', required: true, index: true },
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'Email', value: 'email' },
        { label: 'LINE', value: 'line' },
        { label: 'SMS', value: 'sms' },
      ],
    },
    { name: 'templateKey', type: 'text', required: true },
    {
      name: 'locale',
      type: 'text',
      admin: { description: 'Empty for staff templates — staff use whatever language the clinic operates in.' },
    },
    { name: 'recipient', type: 'text', required: true },
    { name: 'subject', type: 'text' },
    { name: 'html', type: 'textarea' },
    { name: 'text', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Skipped', value: 'skipped' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'scheduledFor',
      type: 'date',
      required: true,
      index: true,
      admin: { description: 'When this notification becomes due to send.' },
    },
    { name: 'sentAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'providerMessageId', type: 'text', admin: { position: 'sidebar' } },
    {
      name: 'dedupeKey',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'channel:templateKey:appointmentId — enforces one row per (appointment, template).' },
    },
    { name: 'attempts', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    { name: 'lastError', type: 'text', admin: { position: 'sidebar' } },
  ],
}
