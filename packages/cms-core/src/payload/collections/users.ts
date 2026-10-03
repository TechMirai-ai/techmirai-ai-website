import type { CollectionConfig } from 'payload'
import { adminOnly, authenticated } from '../access'

export const UsersCollection: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'User', plural: 'Users' },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
    description: 'CMS users. Only admins can create or delete accounts.',
  },
  access: {
    read: authenticated,
    create: adminOnly,
    update: authenticated,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      required: true,
      options: [
        { label: { en: 'Admin', ja: '管理者', bn: 'অ্যাডমিন' }, value: 'admin' },
        { label: { en: 'Editor', ja: '編集者', bn: 'সম্পাদক' }, value: 'editor' },
      ],
      admin: {
        position: 'sidebar',
        description: {
          en: 'Admins have full access. Editors can create and update content but cannot delete.',
          ja: '管理者はすべてにアクセスできます。編集者はコンテンツを作成・更新できますが削除はできません。',
        },
      },
    },
  ],
}
