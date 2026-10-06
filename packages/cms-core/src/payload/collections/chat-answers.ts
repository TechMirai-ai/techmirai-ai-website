import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

/**
 * Chat-only answers (Spec §16.3, IDs C01–C10): matched-answer-layer content for the
 * reception chat widget that has no FAQ-page equivalent. F01–F26 reuse the `faqs`
 * collection's `faqId`/`keywords` fields instead — this collection only holds the
 * entries the FAQ page never shows.
 *
 * `nextButtons.action` is left as free text rather than an enum: the button-action
 * taxonomy (route, booking-service slug, "main-menu", ...) is decided when the chat
 * engine is built (Pack-4/K1–K2), not here.
 */
export const ChatAnswersCollection: CollectionConfig = {
  slug: 'chat-answers',
  labels: { singular: 'Chat Answer', plural: 'Chat Answers' },
  admin: {
    useAsTitle: 'answerId',
    defaultColumns: ['answerId', 'topic', 'active', 'sortOrder'],
  },
  hooks: {
    afterChange: [() => { revalidateTag('chat-answers') }],
  },
  fields: [
    {
      name: 'answerId',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Stable ID — C01 through C10. Never change once set.' },
    },
    {
      name: 'topic',
      type: 'text',
      admin: { description: 'Admin-only label (e.g. "Greeting"). Not shown to visitors.' },
    },
    {
      name: 'keywords',
      type: 'textarea',
      localized: true,
      admin: { description: 'Comma-separated match keywords for this locale.' },
    },
    { name: 'answer', type: 'richText', localized: true },
    {
      name: 'nextButtons',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true },
        {
          name: 'action',
          type: 'text',
          admin: { description: 'e.g. a route, a booking-service slug, or "main-menu".' },
        },
      ],
    },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
