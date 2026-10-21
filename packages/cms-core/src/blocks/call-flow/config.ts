import type { Block } from 'payload'

// Voice-pivot (ECC Master Prompt v2 §6.3): one animated call flow, the
// next-morning dashboard (dummy data, labelled) and the AI-vs-human strip.
// Purely additive block; no existing page uses it until the voice-pivot seed
// writes it.
export const CallFlowBlockConfig: Block = {
  slug: 'call-flow',
  interfaceName: 'CallFlowBlock',
  labels: { singular: 'Call Flow + Dashboard', plural: 'Call Flows' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [{ name: 'label', type: 'text', localized: true, required: true }],
    },
    { name: 'pauseLabel', type: 'text', localized: true },
    { name: 'playLabel', type: 'text', localized: true },
    { name: 'dashboardHeading', type: 'text', localized: true },
    { name: 'dashboardNote', type: 'text', localized: true },
    {
      name: 'dashboardFields',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'value', type: 'text', localized: true },
      ],
    },
    { name: 'aiHeading', type: 'text', localized: true },
    { name: 'aiItems', type: 'array', fields: [{ name: 'text', type: 'text', localized: true, required: true }] },
    { name: 'humanHeading', type: 'text', localized: true },
    { name: 'humanItems', type: 'array', fields: [{ name: 'text', type: 'text', localized: true, required: true }] },
  ],
}
