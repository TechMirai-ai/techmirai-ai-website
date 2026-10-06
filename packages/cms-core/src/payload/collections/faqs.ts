import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'
import { slugField } from '../fields/slug'
import { aiVisibleField } from '../fields/ai-visible'

export const FAQsCollection: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'sortOrder', 'active', 'aiVisible'],
  },
  hooks: {
    afterChange: [() => { revalidateTag('faq') }],
  },
  fields: [
    {
      name: 'faqId',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Stable ID reused by the homepage FAQ picker and chatbot matching — F01 through F26. Never change once set.',
      },
    },
    { name: 'question', type: 'text', localized: true, required: true },
    { name: 'answer', type: 'richText', localized: true },
    {
      name: 'sources',
      type: 'array',
      admin: { description: 'Cite the authoritative source for this answer' },
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { value: 'about-ai-reception', label: { en: 'About AI受付', ja: 'AI受付について' } },
        { value: 'accuracy-and-safety', label: { en: 'Accuracy and safety', ja: '正確さと安全性' } },
        { value: 'setup-and-integration', label: { en: 'Setup and integration', ja: '導入と連携' } },
        { value: 'pricing-and-contract', label: { en: 'Pricing and contract', ja: '料金と契約' } },
        { value: 'support', label: { en: 'Support', ja: 'サポート' } },
        { value: 'about-techmirai', label: { en: 'About TechMirai', ja: 'TechMiraiについて' } },
      ],
    },
    {
      name: 'keywords',
      type: 'textarea',
      localized: true,
      admin: { description: 'Comma-separated match keywords for this locale, used by the chatbot matched-answer layer (Spec §16.3).' },
    },
    {
      name: 'homepage',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show on homepage FAQ block' },
    },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    slugField,
    aiVisibleField,
  ],
}
