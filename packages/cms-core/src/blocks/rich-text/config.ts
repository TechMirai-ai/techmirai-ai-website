import type { Block } from 'payload'

export const RichTextBlockConfig: Block = {
  slug: 'rich-text',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text Blocks' },
  fields: [
    // Not `required: true` — Payload's richText required-validator inspects
    // `value?.root?.children` before the locale:'all' write-transform
    // unwraps `{ locale: value }` (see packages/cms-core/src/seed/utils.ts's
    // `createLocalizedDoc` comment), so a required richText field here
    // fails validation on any multi-locale seed write even with valid
    // content. Pack-3/I2 engine fix — see docs/ENGINE-FIXES.md.
    { name: 'content', type: 'richText', localized: true },
    {
      name: 'maxWidth',
      type: 'select',
      defaultValue: 'prose',
      options: [
        { label: 'Prose (680px)', value: 'prose' },
        { label: 'Wide (1024px)', value: 'wide' },
        { label: 'Full width', value: 'full' },
      ],
    },
    {
      name: 'founderGated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Hide this entire block when the founder switch (company-info global) is off — e.g. the §17.4 sentence naming the founder (Pack-3/I2, Spec §2.3).',
      },
    },
  ],
}
