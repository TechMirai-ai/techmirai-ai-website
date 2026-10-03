import type { Field } from 'payload'

export const aiVisibleField: Field = {
  name: 'aiVisible',
  type: 'checkbox',
  label: {
    en: 'Include in AI corpus',
    ja: 'AIコーパスに含める',
    bn: 'AI কর্পাসে অন্তর্ভুক্ত করুন',
  },
  defaultValue: true,
  admin: {
    description: {
      en: 'When enabled, this document is available to the AI chat agent corpus. Disable for draft content, internal notes, or legally sensitive claims under review.',
      ja: 'オンにすると、このドキュメントはAIチャットエージェントのコーパスに含まれます。下書きや法的に審査中のコンテンツはオフにしてください。',
    },
    position: 'sidebar',
  },
}
