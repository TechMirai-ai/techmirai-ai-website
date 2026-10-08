import type { Block } from 'payload'

// Spec §5.10 ("Security and support"): five trust points + a link to /security.
export const SecurityPointsBlockConfig: Block = {
  slug: 'security-points',
  interfaceName: 'SecurityPointsBlock',
  labels: { singular: 'Security Points', plural: 'Security Points' },
  fields: [
    // Pack-3/H2: no longer required — reused twice per industry page
    // ("what AI受付 does" / "what staff still handle") under the page's own
    // H1, with no distinct heading of its own. Same fix as `process-steps`
    // (H1) and `problem-section` (H2).
    { name: 'heading', type: 'text', localized: true },
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
