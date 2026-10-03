import { safeRevalidateTag as revalidateTag } from '../../../payload/lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../../../payload/fields/ai-visible'
import { slugField } from '../../../payload/fields/slug'

export const DoctorsCollection: CollectionConfig = {
  slug: 'doctors',
  labels: { singular: 'Doctor', plural: 'Doctors' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'yearsOfExperience', 'active'],
  },
  hooks: {
    afterChange: [() => { revalidateTag('doctors') }, () => { revalidateTag('search-index') }],
  },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'title', type: 'text', localized: true, admin: { description: 'e.g. Senior Pediatrician' } },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'specialties',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: { description: 'Departments this doctor practices in (departments are represented by the shared Services collection)' },
    },
    { name: 'bio', type: 'richText', localized: true },
    {
      name: 'credentials',
      type: 'array',
      labels: { singular: 'Credential', plural: 'Credentials' },
      fields: [{ name: 'item', type: 'text', localized: true, required: true }],
      admin: { description: 'Qualifications, degrees, board certifications' },
    },
    { name: 'yearsOfExperience', type: 'number', admin: { position: 'sidebar' } },
    {
      name: 'languages',
      type: 'array',
      labels: { singular: 'Language', plural: 'Languages' },
      fields: [{ name: 'item', type: 'text', localized: true, required: true }],
    },
    {
      name: 'consultationHours',
      type: 'array',
      labels: { singular: 'Consultation Slot', plural: 'Consultation Hours' },
      fields: [
        {
          name: 'day',
          type: 'select',
          required: true,
          options: [
            { label: 'Monday', value: 'mon' },
            { label: 'Tuesday', value: 'tue' },
            { label: 'Wednesday', value: 'wed' },
            { label: 'Thursday', value: 'thu' },
            { label: 'Friday', value: 'fri' },
            { label: 'Saturday', value: 'sat' },
            { label: 'Sunday', value: 'sun' },
          ],
        },
        { name: 'hours', type: 'text', required: true, admin: { description: 'e.g. 09:00–17:00' } },
      ],
    },
    slugField,
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
