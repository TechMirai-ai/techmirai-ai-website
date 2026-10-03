import type { Block } from 'payload'

export const BlogTeaserBlockConfig: Block = {
  slug: 'blog-teaser',
  interfaceName: 'BlogTeaserBlock',
  labels: { singular: 'Blog Teaser', plural: 'Blog Teasers' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'postsSource',
      type: 'select',
      defaultValue: 'latest',
      options: [
        { label: 'Latest Posts', value: 'latest' },
        { label: 'Selected Posts', value: 'selected' },
      ],
    },
    {
      name: 'count',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: {
        condition: (data) => data['postsSource'] === 'latest',
        description: 'Number of latest posts to display',
      },
    },
    {
      name: 'selectedPosts',
      type: 'relationship',
      relationTo: 'blog',
      hasMany: true,
      maxRows: 6,
      admin: {
        condition: (data) => data['postsSource'] === 'selected',
      },
    },
    { name: 'readMoreLabel', type: 'text', localized: true, defaultValue: 'Read more', admin: { description: 'Card link label (e.g. Read more / 続きを読む / আরও পড়ুন)' } },
    { name: 'minReadSuffix', type: 'text', localized: true, defaultValue: 'min read', admin: { description: 'Read-time suffix (e.g. min read / 分で読める / মিনিট পড়া)' } },
    {
      name: 'viewAllCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text', defaultValue: '/blog' },
      ],
    },
  ],
}
