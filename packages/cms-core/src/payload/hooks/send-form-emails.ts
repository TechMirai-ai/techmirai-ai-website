import type { CollectionAfterChangeHook } from 'payload'

interface EmailConfig {
  contactRecipient: string
  jobApplicationRecipient: string
  seminarRecipient: string
  fromEmail: string
}

type FormType = 'contact' | 'job-apply' | 'seminar' | 'download'

interface FormPayload {
  name?: string
  email?: string
  company?: string
  inquiryType?: string
  jobSlug?: string
  seminarSlug?: string
  resourceSlug?: string
  message?: string
}

// ---------------------------------------------------------------------------
// Email dispatch (non-blocking)
// ---------------------------------------------------------------------------

async function dispatch(to: string, subject: string, html: string, fromEmail: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set — skipping email')
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        replyTo: to,           // Important for staff emails
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Resend API error (${response.status}):`, error)
    } else {
      console.log(`✅ Email sent to ${to} | Subject: ${subject}`)
    }
  } catch (err) {
    console.error('Failed to send email via Resend:', err)
  }
}

// ---------------------------------------------------------------------------
// Email builders (Improved)
// ---------------------------------------------------------------------------

function staffHtml(formType: FormType, p: FormPayload, locale?: string): string {
  return `
    <h2>New ${formType} submission</h2>
    <p><strong>Locale:</strong> ${locale || 'en'}</p>
    ${p.name ? `<p><strong>Name:</strong> ${p.name}</p>` : ''}
    ${p.email ? `<p><strong>Email:</strong> ${p.email}</p>` : ''}
    ${p.company ? `<p><strong>Company:</strong> ${p.company}</p>` : ''}
    ${p.inquiryType ? `<p><strong>Inquiry Type:</strong> ${p.inquiryType}</p>` : ''}
    ${p.jobSlug ? `<p><strong>Job:</strong> ${p.jobSlug}</p>` : ''}
    ${p.seminarSlug ? `<p><strong>Seminar:</strong> ${p.seminarSlug}</p>` : ''}
    ${p.resourceSlug ? `<p><strong>Resource:</strong> ${p.resourceSlug}</p>` : ''}
    ${p.message ? `<hr><p><strong>Message:</strong></p><p>${p.message.replace(/\n/g, '<br>')}</p>` : ''}
    <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
  `
}

function confirmationHtml(formType: FormType, name: string): string {
  const copy: Record<FormType, string> = {
    contact: 'We have received your enquiry and will be in touch within 1–2 business days.',
    'job-apply': 'Thank you for applying. Our recruitment team will review your application shortly.',
    seminar: 'Your seminar registration is confirmed. We will send joining details closer to the date.',
    download: 'Your download request has been received. A link will be emailed to you shortly.',
  }

  return `
    <p>Hi ${name},</p>
    <p>${copy[formType]}</p>
    <p>— The Team</p>
  `
}

function staffSubject(formType: FormType, p: FormPayload): string {
  const targets: Record<FormType, string> = {
    contact: `New contact inquiry from ${p.name ?? 'Unknown'}`,
    'job-apply': `New job application from ${p.name ?? 'Unknown'} — ${p.jobSlug ?? ''}`,
    seminar: `New seminar registration from ${p.name ?? 'Unknown'} — ${p.seminarSlug ?? ''}`,
    download: `Download request from ${p.name ?? 'Unknown'} — ${p.resourceSlug ?? ''}`,
  }
  return targets[formType]
}

function confirmationSubject(formType: FormType): string {
  const subjects: Record<FormType, string> = {
    contact: 'We received your enquiry',
    'job-apply': 'Application received',
    seminar: 'Seminar registration confirmed',
    download: 'Your download request',
  }
  return subjects[formType]
}

function resolveStaffRecipient(formType: FormType, config: EmailConfig): string {
  if (formType === 'job-apply') return config.jobApplicationRecipient
  if (formType === 'seminar') return config.seminarRecipient
  return config.contactRecipient
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function makeSendFormEmailsHook(emailConfig: EmailConfig): CollectionAfterChangeHook {
  return async ({ doc, operation }) => {
    if (operation !== 'create') return doc

    const formType = doc.formType as FormType | undefined
    if (!formType) return doc

    const payload = (doc.payload ?? {}) as FormPayload
    const userEmail = payload.email || doc.email
    const userName = payload.name || 'there'
    const locale = doc.locale || 'en'

    if (!userEmail) return doc

    const staffTo = resolveStaffRecipient(formType, emailConfig)

    // Staff notification
    void dispatch(
      staffTo,
      staffSubject(formType, payload),
      staffHtml(formType, payload, locale),
      emailConfig.fromEmail,
    )

    // Auto-reply to user
    void dispatch(
      userEmail,
      confirmationSubject(formType),
      confirmationHtml(formType, userName),
      emailConfig.fromEmail,
    )

    return doc
  }
}