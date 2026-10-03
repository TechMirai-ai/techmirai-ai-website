import type { Block } from 'payload'

export const MissionStatementBlockConfig: Block = {
  slug: 'mission-statement',
  interfaceName: 'MissionStatementBlock',
  labels: {
    singular: 'Mission Statement',
    plural: 'Mission Statements',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'missionHeading',
          label: 'Mission Heading',
          type: 'text',
          localized: true,
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'visionHeading',
          label: 'Vision Heading',
          type: 'text',
          localized: true,
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'missionBody',
          label: 'Mission Description',
          type: 'textarea',
          localized: true,
          required: true,
          admin: { rows: 4, width: '50%' },
        },
        {
          name: 'visionBody',
          label: 'Vision Description',
          type: 'textarea',
          localized: true,
          required: true,
          admin: { rows: 4, width: '50%' },
        },
      ],
    },
    {
      name: 'photos',
      label: 'Photos',
      type: 'array',
      minRows: 2,
      maxRows: 4,
      admin: {
        description: 'Staggered photos at the bottom — 3 to 4 recommended',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          localized: true,
        },
        {
          name: 'size',
          label: 'Display Size',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          admin: {
            description: 'Controls the height of this photo in the staggered row',
          },
        },
      ],
    },
  ],
}