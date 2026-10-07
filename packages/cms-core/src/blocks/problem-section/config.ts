import type { Block } from 'payload'

export const ProblemSectionBlockConfig: Block = {
  slug: 'problem-section',
  interfaceName: 'ProblemSectionBlock',
  labels: { singular: 'Problem Section', plural: 'Problem Sections' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'journeySteps',
      type: 'array',
      admin: { description: 'The arrow-joined customer-journey strip, e.g. "Visit the website" → "Search for information" → ...' },
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    { name: 'journeyCaption', type: 'text', localized: true },
    {
      name: 'cards',
      type: 'array',
      required: true,
      maxRows: 6,
      fields: [{ name: 'text', type: 'textarea', localized: true, required: true }],
    },
    { name: 'navyBandText', type: 'textarea', localized: true },
    { name: 'closingLine', type: 'textarea', localized: true },
  ],
}
