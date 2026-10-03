import type { Block } from 'payload'

export const TreatmentListBlockConfig: Block = {
  slug: 'treatment-list',
  interfaceName: 'TreatmentListBlock',
  labels: { singular: 'Treatment List', plural: 'Treatment Lists' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'subheadline', type: 'textarea', localized: true, admin: { description: 'Short paragraph under the section heading' } },
    {
      name: 'treatments',
      type: 'array',
      label: 'Treatment Sections',
      minRows: 1,
      admin: {
        description: 'One entry per treatment category (e.g. "Osteopathic Treatment", "Sports Injury & Rehab"). Order here sets the 01./02./03. numbering on the page.',
      },
      fields: [
        { name: 'heading', type: 'text', localized: true, required: true },
        { name: 'tagline', type: 'text', localized: true, admin: { description: 'Short one-line summary under the heading' } },
        { name: 'description', type: 'textarea', localized: true },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Optional icon shown next to the heading' },
        },
        {
          name: 'concernTags',
          label: 'Common Concerns',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'One per line, or comma-separated — e.g. "Sprains, Muscle injuries, Joint pain"',
          },
        },
        {
          name: 'areas',
          label: 'Main Areas We Support',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'One per line, or comma-separated — e.g. "Back and lower back, Neck and shoulders"',
          },
        },
        {
          name: 'anchorId',
          type: 'text',
          required: true,
          admin: {
            description: 'Used for "jump to section" links from the page hero — simple slug only, e.g. "sports-injuries". Not localized: keep it identical across languages so the same hero button works in every locale.',
          },
        },
      ],
    },
  ],
}