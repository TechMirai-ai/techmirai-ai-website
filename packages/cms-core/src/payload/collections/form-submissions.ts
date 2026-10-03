import type { CollectionConfig } from 'payload'
import { makeSendFormEmailsHook } from '../hooks/send-form-emails'

// ---------------------------------------------------------------------------
// Factory: receives email routing config from buildCmsConfig
// ---------------------------------------------------------------------------

interface FormSubmissionsConfig {
  contactRecipient: string
  jobApplicationRecipient: string
  seminarRecipient: string
  fromEmail: string
}

export function FormSubmissionsCollection(emailConfig: FormSubmissionsConfig): CollectionConfig {
  return {
    slug: 'form-submissions',
    labels: { singular: 'Form Submission', plural: 'Form Submissions' },
    admin: {
      useAsTitle: 'email',
      defaultColumns: ['formType', 'email', 'status', 'submittedAt'],
      description: 'All form submissions. Contains PII — do not export without consent.',
      group: 'Forms',
    },
    access: {
      read: ({ req }) => Boolean(req.user),
      create: () => true,
      update: ({ req }) => Boolean(req.user),
      delete: ({ req }) => Boolean(req.user),
    },
    hooks: {
      afterChange: [makeSendFormEmailsHook(emailConfig)],
    },
    fields: [
      {
        name: 'formType',
        type: 'select',
        required: true,
        options: [
          { label: 'Contact', value: 'contact' },
          { label: 'Job Application', value: 'job-apply' },
          { label: 'Seminar Registration', value: 'seminar' },
          { label: 'Download Gate', value: 'download' },
        ],
        admin: { position: 'sidebar' },
      },
      {
        name: 'email',
        type: 'email',
        required: true,
        admin: { position: 'sidebar' },
      },
      {
        name: 'locale',
        type: 'text',
        admin: { position: 'sidebar' },
      },
      {
        name: 'status',
        type: 'select',
        defaultValue: 'new',
        required: true,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Replied', value: 'replied' },
          { label: 'Archived', value: 'archived' },
        ],
        admin: { position: 'sidebar' },
      },
      {
        name: 'submittedAt',
        type: 'date',
        admin: { position: 'sidebar', readOnly: true },
        defaultValue: () => new Date().toISOString(),
      },
      {
        name: 'payload',
        type: 'json',
        required: true,
        admin: {
          description: 'Raw validated form payload. Shape varies by formType.',
        },
      },
    ],
  }
}
