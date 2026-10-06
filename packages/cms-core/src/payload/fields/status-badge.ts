import type { Field } from 'payload'

/**
 * Drives the existing presentational StatusBadge component (src/components/ui/StatusBadge.tsx),
 * which already defines exactly these two variants but had no CMS field behind it.
 */
export const statusBadgeField: Field = {
  name: 'status',
  type: 'select',
  defaultValue: 'available',
  options: [
    { value: 'available', label: { en: 'Available now', ja: '提供中' } },
    { value: 'inDevelopment', label: { en: 'In development', ja: '開発中' } },
  ],
  admin: {
    position: 'sidebar',
    description: {
      en: 'Which status badge this card shows.',
      ja: 'このカードに表示するステータスバッジ。',
    },
  },
}
