import type { Block } from 'payload'

export const CapabilityCardsBlockConfig: Block = {
  slug: 'capability-cards',
  interfaceName: 'CapabilityCardsBlock',
  labels: { singular: 'Capability Cards', plural: 'Capability Cards' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'cards',
      type: 'array',
      required: true,
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'available',
          admin: { description: 'Maps to the Spec\'s fixed glossary wording ("Available now"/"提供中" or "In development"/"開発中") — never store that wording directly here.' },
          options: [
            { label: 'Available now', value: 'available' },
            { label: 'In development', value: 'in-development' },
          ],
        },
        { name: 'description', type: 'textarea', localized: true, required: true },
      ],
    },
    {
      name: 'badgeRow',
      type: 'text',
      localized: true,
      admin: { description: 'One "·"-joined line, e.g. "Japanese and English · Admin panel your staff can update · ..."' },
    },
    { name: 'splitHeading', type: 'text', localized: true },
    {
      name: 'splitLeftTitle',
      type: 'text',
      localized: true,
      admin: { description: 'The "AI does not replace staff" sub-block\'s left column title.' },
    },
    {
      name: 'splitLeftItems',
      type: 'array',
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    { name: 'splitRightTitle', type: 'text', localized: true },
    {
      name: 'splitRightItems',
      type: 'array',
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    { name: 'splitClosingLine', type: 'textarea', localized: true },
  ],
}
