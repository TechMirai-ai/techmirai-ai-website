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
        {
          name: 'founderGated',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Hide this entire row when the founder switch (company-info global) is off — e.g. a company-profile "Representative" row (Pack-3/I2, Spec §2.3).',
          },
        },
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
