import type { Block } from 'payload'

// Spec §9 ("Pricing and Security & Support"): several plain "label +
// description" row tables (Included, Not included, Options, Personal
// information, Support, Pricing FAQ) with no per-row status concept and no
// step sequence. `process-steps`/`setup-steps` render numbered step badges
// (wrong here — these aren't sequential steps) and
// `integrations-status-table` forces a fixed 4-value status badge that
// doesn't apply, so this is a new block rather than a reuse of either.
export const LabelValueListBlockConfig: Block = {
  slug: 'label-value-list',
  interfaceName: 'LabelValueListBlock',
  labels: { singular: 'Label/Value List', plural: 'Label/Value Lists' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'detail', type: 'textarea', localized: true, required: true },
      ],
    },
    {
      name: 'footnote',
      type: 'textarea',
      localized: true,
      admin: { description: 'The bottom line, e.g. "What changes the price..."' },
    },
  ],
}
