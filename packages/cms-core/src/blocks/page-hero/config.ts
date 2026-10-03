import type { Block } from 'payload'

export const PageHeroBlockConfig: Block = {
  slug: 'page-hero',
  interfaceName: 'PageHeroBlock',
  labels: { singular: 'Page Banner / Section Title', plural: 'Page Banners / Section Titles' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'hero',
      options: [
        { label: 'Hero (full background photo)', value: 'hero' },
        { label: 'Page Title (plain white heading)', value: 'page-title' },
      ],
      admin: {
        description: 'Hero = full background photo with overlay. Page Title = plain centred heading on white.',
      },
    },

    // ── hero variant fields ───────────────────────────────────────────
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        description: 'Max 80 characters. Main heading shown on the hero.',
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
    },
    {
      name: 'coloredSubtitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Max 80 characters. Renders in brand green below the main heading.',
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
    },
    {
      name: 'body',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Max 300 characters.',
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Background photo. Leave empty for a solid dark background.',
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
    },
    {
      name: 'overlayOpacity',
      type: 'number',
      defaultValue: 50,
      min: 0,
      max: 100,
      admin: {
        description: '0 = no overlay, 100 = fully opaque. Default 50.',
        step: 5,
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
    },
    {
      name: 'overlayColor',
      type: 'select',
      defaultValue: 'black',
      options: [
        { label: 'Black', value: 'black' },
        { label: 'Brand', value: 'brand' },
        { label: 'None', value: 'none' },
      ],
      admin: {
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
    },
    {
      name: 'primaryButton',
      type: 'group',
      admin: {
        description: 'Primary CTA button. Leave label empty to hide.',
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
      fields: [
        { name: 'label', type: 'text', localized: true, admin: { description: 'Max 60 characters' } },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'secondaryButton',
      type: 'group',
      admin: {
        description: 'Secondary CTA button. Leave label empty to hide.',
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
      fields: [
        { name: 'label', type: 'text', localized: true, admin: { description: 'Max 60 characters' } },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'profileCard',
      type: 'group',
      admin: {
        description: 'Floating info card on the right of the hero. Leave cardHeading empty to hide.',
        condition: (data) => data['variant'] === 'hero' || !data['variant'],
      },
      fields: [
        {
          name: 'badgeText',
          type: 'text',
          localized: true,
          admin: { description: 'Max 40 characters, e.g. "Since 2005"' },
        },
        {
          name: 'cardHeading',
          type: 'text',
          localized: true,
          admin: { description: 'Max 80 characters, e.g. "Corporate Profile"' },
        },
        {
          name: 'rows',
          type: 'array',
          maxRows: 6,
          fields: [
            { name: 'label', type: 'text', required: true, localized: true, admin: { description: 'Max 60 characters' } },
            { name: 'value', type: 'text', required: true, localized: true, admin: { description: 'Max 80 characters' } },
          ],
        },
      ],
    },

    // ── page-title variant fields ────────────────────────────────────
    {
      name: 'pageTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Max 100 characters. Centred H1 on white background.',
        condition: (data) => data['variant'] === 'page-title',
      },
    },

    // ── shared fields ────────────────────────────────────────────────
    { name: 'showBreadcrumb', type: 'checkbox', defaultValue: false },
    {
      name: 'breadcrumbItems',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true, localized: true, admin: { description: 'Max 60 characters' } },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'textAlignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    },
    {
      name: 'minHeight',
      type: 'select',
      defaultValue: 'md',
      options: [
        { label: 'Small (240px)', value: 'sm' },
        { label: 'Medium (360px)', value: 'md' },
        { label: 'Large (480px)', value: 'lg' },
      ],
    },
  ],
}
