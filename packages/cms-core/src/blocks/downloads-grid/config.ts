import type { Block } from 'payload'

export const DownloadsGridBlockConfig: Block = {
  slug: 'downloads-grid',
  interfaceName: 'DownloadsGridBlock',
  labels: { singular: 'Downloads Grid', plural: 'Downloads Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'From Collection', value: 'collection' },
        { label: 'Inline', value: 'inline' },
      ],
    },
    {
      name: 'selectedDownloads',
      type: 'relationship',
      relationTo: 'downloads',
      hasMany: true,
      maxRows: 6,
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'collection',
        description: 'Leave empty to show all active downloads (max 6)',
      },
    },
    {
      name: 'inlineDownloads',
      type: 'array',
      maxRows: 6,
      admin: { condition: (_data, siblingData) => siblingData?.source === 'inline', },
      fields: [
        { name: 'categoryLabel', type: 'text', localized: true },
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'meta', type: 'text', localized: true, admin: { description: 'e.g. 12 pages, Excel file' } },
        { name: 'href', type: 'text', required: true },
      ],
    },
    { name: 'downloadLabel', type: 'text', localized: true, defaultValue: 'Free Download', admin: { description: 'CTA button label on each card (e.g. Free Download / 無料ダウンロード / বিনামূল্যে ডাউনলোড)' } },
    {
      name: 'viewAllCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text', defaultValue: '/downloads' },
      ],
    },
  ],
}
