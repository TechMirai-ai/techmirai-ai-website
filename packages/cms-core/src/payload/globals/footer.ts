import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { GlobalConfig } from 'payload'

export const FooterGlobal: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  hooks: { afterChange: [() => { revalidateTag('footer') }] },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Footer columns',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', localized: true, required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    { 
      name: 'contactEmail', 
      type: 'text', 
      label: 'Contact Email',
      admin: {
        description: 'The operational contact email address displayed in the footer info card.',
        placeholder: 'info@example.com'
      }
    },
    { 
      name: 'officeAddress', 
      type: 'textarea', 
      label: 'Office Address',
      localized: true,
      admin: {
        description: 'The physical corporate office address. Line breaks will be preserved on the frontend layout.',
        placeholder: '1-2-3 Sample Street, Sample Ward,\nSample City'
      }
    },
    { name: 'copyrightText', type: 'text', localized: true },
  ],
}