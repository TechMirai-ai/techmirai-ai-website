import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

export const MediaCollection: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'public/media',
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (doc?.filename && process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
          doc.url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${doc.filename}`
        }
        return doc
      },
    ],
    afterChange: [() => { revalidateTag('media') }],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: { description: 'Describe the image for screen readers and SEO' },
    },
  ],
}