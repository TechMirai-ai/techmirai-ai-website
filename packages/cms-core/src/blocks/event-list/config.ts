import type { Block } from 'payload'

export const EventListBlockConfig: Block = {
  slug: 'event-list',
  interfaceName: 'EventListBlock',
  labels: { singular: 'Event List', plural: 'Event Lists' },
  fields: [
    { name: 'sectionHeading', type: 'text', localized: true },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 0,
      admin: { description: 'Set to 0 for unlimited (events index page)' },
    },
    {
      name: 'showPastToggle',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show toggle for past events' },
    },
    {
      name: 'category',
      type: 'text',
      admin: { description: 'Optional: filter by category slug' },
    },
  ],
}
