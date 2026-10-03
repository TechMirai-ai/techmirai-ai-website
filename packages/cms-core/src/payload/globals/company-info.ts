import type { GlobalConfig } from 'payload'
import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'

const localeSubfields = [
  { name: 'en', type: 'text' as const, label: 'English' },
  { name: 'ja', type: 'text' as const, label: 'Japanese' },
]

const localeTextareaSubfields = [
  { name: 'en', type: 'textarea' as const, label: 'English' },
  { name: 'ja', type: 'textarea' as const, label: 'Japanese' },
]

export const CompanyInfoGlobal: GlobalConfig = {
  slug: 'company-info',
  label: 'Company Information',
  admin: { 
    description: 'Used in footer, contact page, company profile, and schema.org markup' 
  },
  hooks: { 
    afterChange: [() => { revalidateTag('company') }] 
  },
  fields: [
    // General Company Info
    { name: 'legalName', type: 'text' },
    { name: 'registrationNumber', type: 'text' },
    { name: 'foundedYear', type: 'number' },
    { name: 'capital', type: 'text' },
    { name: 'licenseNumber', type: 'text' },
    { name: 'employeeCount', type: 'number' },

    {
      name: 'description',
      type: 'group',
      label: 'Company description',
      fields: localeTextareaSubfields,
    },

    // ==================== MULTIPLE OFFICES (with Map + Nearest Stations) ====================
    {
      name: 'offices',
      type: 'array',
      label: 'Offices',
      admin: { description: 'Add Japan, Bangladesh, Malaysia offices with their own map and stations' },
      fields: [
        {
          name: 'country',
          type: 'text',
          required: true,
          label: 'Office Name / Country',
        },
        {
          name: 'legalName',
          type: 'text',
          label: 'Legal Company Name',
        },
        {
          name: 'address',
          type: 'textarea',
          required: true,
        },
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'fax',
          type: 'text',
        },
        {
          name: 'mobile',
          type: 'text',
        },
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'website',
          type: 'text',
        },

        // Per Office Google Map
        {
          name: 'googleMapsEmbedUrl',
          type: 'text',
          label: 'Google Maps Embed URL',
          admin: {
            description: 'Paste the src value from Google Maps embed iframe',
          },
        },

        // Per Office Nearest Stations
        {
          name: 'nearestStations',
          type: 'array',
          label: 'Nearest Stations',
          fields: [
            {
              name: 'stationName',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}