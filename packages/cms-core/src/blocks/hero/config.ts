import type { Block } from 'payload'

export const HeroBlockConfig: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'headline', type: 'text', localized: true, required: true },
    { name: 'subheadline', type: 'textarea', localized: true },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'heroSlides',
      label: 'Hero Image Slides',
      type: 'array',
      minRows: 1,
      maxRows: 5,
      admin: {
        description: 'Full-width slider images. If empty, falls back to Background Image.',
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'alt', type: 'text', localized: true },
        { name: 'title', type: 'text', localized: true },
        { name: 'subtitle', type: 'text', localized: true },
      ],
    },
    {
      name: 'reservationButton',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true, defaultValue: 'Online Reservation' },
        { name: 'href', type: 'text', required: true, defaultValue: '#' },
      ],
    },
    {
      name: 'hoursTable',
      type: 'group',
      fields: [
        { name: 'morningLabel', type: 'text', defaultValue: '9:00 – 12:30' },
        { name: 'afternoonLabel', type: 'text', defaultValue: '14:30 – 18:00' },
        {
          name: 'rows',
          type: 'array',
          minRows: 7,
          maxRows: 7,
          admin: { description: 'One row per day, in display order (Mon → Sun/Holidays).' },
          fields: [
            { name: 'day', type: 'text', localized: true, required: true },
            { name: 'morningOpen', type: 'checkbox', defaultValue: true },
            { name: 'afternoonOpen', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
    {
      name: 'notes',
      type: 'array',
      maxRows: 6,
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'line', type: 'text', localized: true, required: true },
        { name: 'mapHref', type: 'text', defaultValue: '#map' },
      ],
    },
    {
      name: 'firstVisitCard',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', localized: true, defaultValue: 'For First-Time Visitors' },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'linkLabel', type: 'text', localized: true, defaultValue: 'First-time visitors, click here' },
        { name: 'linkHref', type: 'text', defaultValue: '#' },
      ],
    },
    {
      name: 'showScrollIndicator',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}