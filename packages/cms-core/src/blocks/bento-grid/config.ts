import type { Block } from 'payload'

export const BentoGridBlockConfig: Block = {
  slug: 'bento-grid',
  interfaceName: 'BentoGridBlock',
  labels: { singular: 'Bento Grid', plural: 'Bento Grids' },
  fields: [
    // Pack-3/H2: eyebrow/heading no longer required — the Solutions hub's
    // 4-card link grid has no distinct heading of its own in the Spec,
    // sitting directly under the hub's H1/intro (same situation
    // `process-steps`/`problem-section`/`security-points` already hit).
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'items',
      type: 'array',
      required: true,
      maxRows: 6,
      labels: { singular: 'Reason', plural: 'Reasons' },
      fields: [
        {
          name: 'number',
          type: 'text',
          admin: { description: 'e.g. "01" — auto-generated if left empty' },
        },
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'icon', type: 'text', admin: { description: 'Lucide icon name (optional)' } },
        {
          name: 'href',
          type: 'text',
          admin: { description: 'Optional — makes the whole card a link (Pack-3/H2, Solutions hub).' },
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'asymmetric',
      options: [
        { label: 'Asymmetric bento (recommended for 5 items)', value: 'asymmetric' },
        { label: 'Standard 3-column grid', value: 'standard' },
      ],
    },
  ],
}
