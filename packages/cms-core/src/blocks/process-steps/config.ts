import type { Block } from 'payload'

// Spec §5.7 ("Implementation process"): six numbered steps from first
// conversation to launch. `sub` carries the Spec's "[X weeks]" timeline
// placeholder verbatim — bracket kept, per CLAUDE.md rule 5.
export const ProcessStepsBlockConfig: Block = {
  slug: 'process-steps',
  interfaceName: 'ProcessStepsBlock',
  labels: { singular: 'Process Steps', plural: 'Process Steps' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'sub', type: 'textarea', localized: true },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        // Pack-3/H3: no longer required — the five-step customer journey
        // (Spec §8.1) has one sentence per step with no per-step title.
        { name: 'title', type: 'text', localized: true },
        { name: 'line', type: 'textarea', localized: true, required: true },
      ],
    },
  ],
}
