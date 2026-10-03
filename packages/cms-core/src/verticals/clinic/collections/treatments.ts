import { safeRevalidateTag as revalidateTag } from '../../../payload/lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../../../payload/fields/ai-visible'
import { slugField } from '../../../payload/fields/slug'

// Pricing: insured (保険診療) treatments never carry a displayed price — Japanese
// medical-advertising rules restrict advertising fixed prices for insurance-covered
// care, and insurance-portion pricing varies by patient. Self-pay (自費診療)
// treatments may show a real price; `price` is only meaningful when
// insuranceType is 'self-pay' and is ignored/hidden otherwise.
export const TreatmentsCollection: CollectionConfig = {
  slug: 'treatments',
  labels: { singular: 'Treatment', plural: 'Treatments' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'department', 'insuranceType', 'duration', 'active'],
  },
  hooks: {
    afterChange: [() => { revalidateTag('treatments') }, () => { revalidateTag('search-index') }],
  },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'description', type: 'richText', localized: true },
    { name: 'duration', type: 'text', localized: true, admin: { description: 'e.g. 30 minutes' } },
    {
      name: 'insuranceType',
      type: 'select',
      required: true,
      defaultValue: 'insured',
      options: [
        { label: 'Insured (保険診療)', value: 'insured' },
        { label: 'Self-pay (自費診療)', value: 'self-pay' },
      ],
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        description: 'Yen, tax included. Self-pay treatments only — never set for insured treatments.',
        condition: (_data, siblingData) => siblingData?.insuranceType === 'self-pay',
      },
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      admin: { description: 'Departments are represented by the shared Services collection' },
    },
    slugField,
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    aiVisibleField,
  ],
}
