import type { Block } from 'payload'

// Spec §5.10 ("Security and support"): five trust points + a link to /security.
export const SecurityPointsBlockConfig: Block = {
  slug: 'security-points',
  interfaceName: 'SecurityPointsBlock',
  labels: { singular: 'Security Points', plural: 'Security Points' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    {
      name: 'points',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'text', type: 'textarea', localized: true, required: true }],
    },
    { name: 'buttonLabel', type: 'text', localized: true },
    { name: 'buttonHref', type: 'text' },
  ],
}
