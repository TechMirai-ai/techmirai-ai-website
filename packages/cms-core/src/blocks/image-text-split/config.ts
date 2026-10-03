import type { Block } from 'payload'

export const ImageTextSplitBlockConfig: Block = {
  slug: 'image-text-split',
  interfaceName: 'ImageTextSplitBlock',
  labels: { singular: 'Image and Text Side by Side', plural: 'Image and Text Side by Side Blocks' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'imageAlt', type: 'text', required: true, localized: true, admin: { description: 'Max 150 characters' } },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
    { name: 'eyebrow', type: 'text', localized: true, admin: { description: 'Max 60 characters' } },
    { name: 'heading', type: 'text', required: true, localized: true, admin: { description: 'Max 100 characters' } },
    { name: 'body', type: 'richText', required: true, localized: true },
    {
      name: 'primaryButton',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true, admin: { description: 'Max 60 characters' } },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'imageSplit',
      type: 'select',
      defaultValue: '50/50',
      options: [
        { label: '40/60', value: '40/60' },
        { label: '50/50', value: '50/50' },
        { label: '60/40', value: '60/40' },
      ],
    },
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'white',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
    },
    {
      name: 'verticalAlign',
      type: 'select',
      defaultValue: 'center',
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
      ],
    },
  ],
}
