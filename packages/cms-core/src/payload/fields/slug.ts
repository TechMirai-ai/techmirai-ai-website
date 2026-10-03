import type { Field } from 'payload'

export const slugField: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'URL-safe identifier. Auto-generated from title if left blank.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return value
        const source = (data as Record<string, unknown> | undefined)?.['title']
        if (typeof source === 'string') {
          return source
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
        }
        return value
      },
    ],
  },
}
