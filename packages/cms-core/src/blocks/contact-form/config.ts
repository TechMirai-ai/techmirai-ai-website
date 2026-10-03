import type { Block } from 'payload'

export const ContactFormBlockConfig: Block = {
  slug: 'contact-form',
  interfaceName: 'ContactFormBlock',
  labels: { singular: 'Contact Form', plural: 'Contact Forms' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      options: [
        { label: 'General contact', value: 'contact' },
        { label: 'Job application', value: 'job-apply' },
      ],
    },
    { name: 'heading', type: 'text', localized: true },
    { name: 'subheading', type: 'text', localized: true },
    {
      name: 'showTurnstile',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Disable in development only' },
    },
  ],
}
