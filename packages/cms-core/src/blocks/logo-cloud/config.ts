import type { Block } from 'payload'

export const LogoCloudBlockConfig: Block = {
  slug: 'logo-cloud',
  interfaceName: 'LogoCloudBlock',
  labels: { singular: 'Logo Cloud', plural: 'Logo Clouds' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true, required: true },
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'logos',
      type: 'array',
      required: true,
      labels: { singular: 'Logo', plural: 'Logos' },
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'name', type: 'text', localized: true, required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
    {
      name: 'scrollSpeed',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ],
    },
  ],
}
