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

    // ==================== FOUNDER (Pack-2/F2, Spec §1 item 4 and §2.3) ====================
    // Single source of truth for every place the founder appears (homepage team cards, About
    // founder message/team, company-profile Representative row, Organization schema `founder`,
    // the canonical company-facts sentence reused on About/schema/chatbot, and the chatbot's F23
    // answer). One switch here is meant to remove him everywhere — see docs/WORK-ORDER.md §2.3.
    // Seeded `visible: true` for local review only; the public on/off call is Jamal's before any
    // deploy (WORK-ORDER.md decision 5).
    {
      name: 'founder',
      type: 'group',
      label: 'Founder',
      fields: [
        { name: 'visible', type: 'checkbox', defaultValue: true },
        {
          name: 'person',
          type: 'relationship',
          relationTo: 'team',
          hasMany: false,
          admin: { description: 'The team member this founder data is about (Jamal Shah).' },
        },
        {
          name: 'yearsInJapan',
          type: 'group',
          label: 'Years in Japan',
          fields: localeSubfields,
        },
        {
          name: 'companyFactsSentence',
          type: 'group',
          label: 'Canonical company-facts sentence',
          admin: {
            description: 'The one sentence reused on About, in Organization JSON-LD, and in the chatbot F23 answer.',
          },
          fields: localeTextareaSubfields,
        },
      ],
    },

    // ==================== COMPANY PROFILE (会社概要, Spec 10.6) ====================
    {
      name: 'businessForm',
      type: 'group',
      label: 'Business form',
      fields: localeSubfields,
    },
    {
      name: 'address',
      type: 'group',
      label: 'Publishable address',
      admin: { description: 'The one publishable address for the company profile. Distinct from the detailed per-office addresses below.' },
      fields: localeTextareaSubfields,
    },
    {
      name: 'businessHours',
      type: 'group',
      label: 'Business hours',
      fields: localeSubfields,
    },
    {
      name: 'mainClient',
      type: 'group',
      label: 'Main client',
      fields: [
        { name: 'name', type: 'text' },
        {
          name: 'permissionConfirmed',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Written permission to name this client has been confirmed (Spec §1 item 14).' },
        },
      ],
    },

    // ==================== MULTIPLE OFFICES (with Map + Nearest Stations) ====================
    {
      name: 'offices',
      type: 'array',
      label: 'Offices',
      admin: { description: 'Add offices with their own map and stations' },
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