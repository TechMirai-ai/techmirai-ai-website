import type { Block } from 'payload'

// Spec §8.1 ("Setup in six steps... with what we need from you"): a
// 3-field-per-row table, distinct from `process-steps`' 2-field card grid —
// this block owns its own `name`/`description`/`need` shape rather than
// extending that block.
export const SetupStepsBlockConfig: Block = {
  slug: 'setup-steps',
  interfaceName: 'SetupStepsBlock',
  labels: { singular: 'Setup Steps', plural: 'Setup Steps' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'sub', type: 'textarea', localized: true },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 6,
      maxRows: 6,
      fields: [
        { name: 'name', type: 'text', localized: true, required: true },
        { name: 'description', type: 'textarea', localized: true, required: true },
        {
          name: 'need',
          type: 'textarea',
          localized: true,
          required: true,
          admin: { description: 'The "what we need from you" column for this row.' },
        },
      ],
    },
    {
      name: 'footnote',
      type: 'textarea',
      localized: true,
      admin: { description: 'The under-the-table line, e.g. "No list of questions yet?..."' },
    },
  ],
}
