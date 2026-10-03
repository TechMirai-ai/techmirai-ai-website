import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { GlobalConfig } from 'payload'

export const HeaderGlobal: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  hooks: { afterChange: [() => { revalidateTag('header') }] },
  fields: [
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'navItems',
      type: 'array',
      label: 'Navigation items',
      fields: [
        { 
          name: 'label', 
          type: 'text', 
          required: true, 
          localized: true, // 👈 Shifted to native CMS localization
          admin: { description: 'The text displayed in the navigation item' } 
        },
        { name: 'href', type: 'text', required: true },
        {
          name: 'children',
          type: 'array',
          label: 'Dropdown items',
          admin: { description: 'Used for simple dropdown menus (e.g. About)' },
          fields: [
            { 
              name: 'label', 
              type: 'text', 
              required: true, 
              localized: true // 👈 Shifted to native CMS localization
            },
            { name: 'href', type: 'text', required: true },
          ],
        },
        {
          name: 'megaMenu',
          type: 'checkbox',
          label: 'Use mega menu layout',
          defaultValue: false,
          admin: { description: 'Enable for wide multi-column dropdown panels (e.g. Services)' },
        },
        // Add description inside megaColumns -> items
        {
          name: 'megaColumns',
          type: 'array',
          label: 'Mega menu columns',
          admin: {
            condition: (_data, siblingData) => Boolean(siblingData?.megaMenu),
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              localized: true,
            },
            {
              name: 'items',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                { name: 'href', type: 'text', required: true },
                {
                  name: 'description',
                  type: 'textarea', // 👈 Added for the sub-text details
                  localized: true,
                  admin: { description: 'Sub-text description for the service' }
                },
              ],
            },
          ],
        },
        // Add an optional side image to the top-level nav item layout
        {
          name: 'featuredImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Mega Menu Featured Image',
          admin: {
            condition: (_data, siblingData) => Boolean(siblingData?.megaMenu),
            description: 'Image displayed on the left side of the mega menu (e.g., classroom image)'
          }
        }
      ],
    },
    {
      name: 'ctaButton',
      type: 'group',
      label: 'Header CTA button',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text' },
      ],
    },
    {
  name: 'phoneButton',
  type: 'group',
  label: 'Header Phone Button (used in mobile menu)',
  fields: [
    { name: 'phoneDisplay', type: 'text', required: true, defaultValue: '+81-3-5432-1188' },
    { name: 'phoneHref', type: 'text', required: true, defaultValue: 'tel:+81354321188' },
    { name: 'badgeLabel', type: 'text', localized: true, defaultValue: 'Call Now' },
    { name: 'subLabel', type: 'text', localized: true, defaultValue: 'Click to call us' },
  ],
},
{
  name: 'lineButton',
  type: 'group',
  label: 'Header LINE Button (used in mobile menu)',
  fields: [
    { name: 'href', type: 'text', required: true, defaultValue: '#' },
    { name: 'label', type: 'text', localized: true, defaultValue: 'LINE Booking' },
    { name: 'subLabel', type: 'text', localized: true, defaultValue: 'Easy booking & chat' },
  ],
},
  ],
}