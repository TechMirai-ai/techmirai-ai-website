import type { Block } from 'payload'

export const LiveDemoBlockConfig: Block = {
  slug: 'live-demo',
  interfaceName: 'LiveDemoBlock',
  labels: { singular: 'Live Demo', plural: 'Live Demos' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'body', type: 'textarea', localized: true },
    {
      name: 'checklistItems',
      type: 'array',
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    {
      name: 'buttonLabel',
      type: 'text',
      localized: true,
    },
    { name: 'buttonHref', type: 'text' },
    {
      name: 'qrCaption',
      type: 'text',
      localized: true,
      admin: { description: 'Shown next to the QR code, which is desktop-only per Spec §19.' },
    },
    { name: 'smallPrint', type: 'text', localized: true },
    {
      name: 'threeStepStrip',
      type: 'array',
      minRows: 3,
      maxRows: 3,
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    {
      name: 'tiles',
      type: 'array',
      required: true,
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'description', type: 'textarea', localized: true, required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'buttonLabel', type: 'text', localized: true },
      ],
    },
  ],
}
