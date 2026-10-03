import type { Block } from 'payload'

export const CaseStudyCarouselBlockConfig: Block = {
  slug: 'case-study-carousel',
  interfaceName: 'CaseStudyCarouselBlock',
  labels: { singular: 'Case Study Carousel', plural: 'Case Study Carousels' },
  fields: [
    {
      name: 'missionCard',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
        { name: 'statBadge', type: 'text', localized: true },
      ],
    },
    {
      name: 'impactCard',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
        { name: 'ctaLabel', type: 'text', localized: true },
        { name: 'ctaHref', type: 'text' },
        {
          name: 'mapMarkers',
          type: 'array',
          fields: [
            { name: 'topPercent', type: 'number', min: 0, max: 100, required: true },
            { name: 'leftPercent', type: 'number', min: 0, max: 100, required: true },
          ],
        },
      ],
    },
    // Retained hidden parameters to satisfy old TS interfaces without code breaks
    { name: 'sectionHeading', type: 'text', admin: { condition: () => false } },
    { name: 'items', type: 'relationship', relationTo: 'testimonials', hasMany: true, admin: { condition: () => false } },
    { name: 'autoAdvanceSeconds', type: 'number', defaultValue: 5, admin: { condition: () => false } },
  ],
}
