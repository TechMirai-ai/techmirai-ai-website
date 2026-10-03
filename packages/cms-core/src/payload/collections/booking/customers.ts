import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access'

/**
 * A booking customer. Names are NOT localized — they are per-record data, not
 * translatable content.
 *
 * Kana readings (familyNameKana / givenNameKana) are MANDATORY: Japanese
 * businesses sort and call customers by their kana reading, so these must
 * always be present.
 *
 * `createdAt`/`updatedAt` are provided by Payload's default timestamps.
 */
export const CustomersCollection: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Customer', plural: 'Customers' },
  // PII — staff only. Delete is forced admin-only by the config factory.
  access: { read: authenticated, create: authenticated, update: authenticated },
  admin: {
    useAsTitle: 'familyNameKana',
    defaultColumns: ['familyName', 'givenName', 'phone', 'memberNumber'],
    group: 'Booking',
    description: 'Contains PII. Do not export without consent.',
  },
  fields: [
    { name: 'familyName', type: 'text', required: true },
    { name: 'givenName', type: 'text', required: true },
    { name: 'familyNameKana', type: 'text', required: true },
    { name: 'givenNameKana', type: 'text', required: true },
    { name: 'phone', type: 'text', index: true },
    { name: 'email', type: 'email' },
    { name: 'memberNumber', type: 'text', admin: { position: 'sidebar' } },
    { name: 'locale', type: 'text', admin: { position: 'sidebar' } },
    {
      name: 'lineUserId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Set by the LINE follow webhook once this patient links their LINE account (Part 2, LIFF booking). Nullable/unique — most customers have no LINE link.',
      },
    },
    {
      name: 'lineChannelDead',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Set automatically when the linked LINE account blocks the OA (unfollow webhook). The notification dispatcher reads this to fail over to email — LINE push responses cannot detect a block on their own.',
      },
    },
  ],
}
