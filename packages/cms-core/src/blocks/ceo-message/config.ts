import type { Block } from 'payload'

export const CEOMessageBlockConfig: Block = {
  slug: 'ceo-message',
  interfaceName: 'CEOMessageBlock',
  labels: { singular: 'CEO / Leader Message', plural: 'CEO / Leader Messages' },
  fields: [
    { name: 'portrait', type: 'upload', relationTo: 'media' },
    { name: 'portraitAlt', type: 'text', required: true, localized: true, admin: { description: 'Max 150 characters' } },
    { name: 'name', type: 'text', required: true, localized: true, admin: { description: 'Max 100 characters' } },
    { name: 'title', type: 'text', required: true, localized: true, admin: { description: 'Max 100 characters' } },
    { name: 'message', type: 'richText', required: true, localized: true },
    { name: 'signature', type: 'upload', relationTo: 'media' },
    {
      name: 'portraitPosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'white',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Light', value: 'light' },
        { label: 'black', value: 'black' },
      ],
    },
  ],
}
