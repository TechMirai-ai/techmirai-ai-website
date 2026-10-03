import type { Block } from 'payload'

export const CTABannerBlockConfig: Block = {
  slug: 'cta-banner',
  interfaceName: 'CTABannerBlock',
  labels: { singular: 'Call to Action Banner', plural: 'Call to Action Banners' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'body', type: 'text', localized: true },
    {
      name: 'primaryButton',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'secondaryButton',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text' },
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'outline',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Outline', value: 'outline' },
          ],
        },
      ],
    },
    {
      name: 'primaryButtonVariant',
      type: 'select',
      defaultValue: 'solid',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'brand',
      options: [
        { label: 'Brand', value: 'brand' },
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'centered',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Split (text left, CTA right)', value: 'split' },
      ],
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'gradient',
      options: [
        { label: 'Gradient (recommended)', value: 'gradient' },
        { label: 'Solid', value: 'solid' },
        { label: 'Background image', value: 'image' },
      ],
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Required when variant is "Background image"' },
    },
  ],
}
