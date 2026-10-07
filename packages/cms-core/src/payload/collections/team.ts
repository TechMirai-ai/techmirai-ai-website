import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../fields/ai-visible'
import { slugField } from '../fields/slug'

export const TeamCollection: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Team Member', plural: 'Team Members' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'title', 'featured', 'sortOrder'] },
  hooks: { afterChange: [() => { revalidateTag('team') }, () => { revalidateTag('search-index') }] },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'richText', localized: true },
    {
      name: 'shortBio',
      type: 'text',
      localized: true,
      admin: {
        description:
          'One-line card description for compact team-card UIs (homepage §5.11). Distinct from the full "bio" richText, which About (Pack-3/I2) uses.',
      },
    },
    slugField,
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show when TeamGrid has no explicit member list',
      },
    },
    {
      name: 'visible',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Public visibility — uncheck until this person has given written consent to publish their name and photo (Spec §1 item 15). Distinct from "Include in AI corpus" below.',
      },
    },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
