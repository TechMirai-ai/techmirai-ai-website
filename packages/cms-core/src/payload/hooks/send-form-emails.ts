import type { CollectionAfterChangeHook } from 'payload'

interface EmailConfig {
  contactRecipient: string
  jobApplicationRecipient: string
  seminarRecipient: string
  // Pack-4/J1: intentionally optional, no default — see resolveStaffRecipient.
  assessmentRecipient?: string
  fromEmail: string
}

type FormType = 'contact' | 'job-apply' | 'seminar' | 'download' | 'assessment'

interface FormPayload {
  name?: string
  email?: string
  company?: string
  inquiryType?: string
  jobSlug?: string
  seminarSlug?: string
  resourceSlug?: string
  message?: string
  // Pack-4/J1: /assessment (Spec §12.2) additions.
  url?: string
  phone?: string
  industry?: string
  bookingSystem?: string
  lineAccount?: string
  problem?: string[]
  contactPref?: string
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
// Email builders
// ---------------------------------------------------------------------------

// Pack-4/J1: /assessment's auto-reply is the Spec §12.3 text verbatim,
// locale-branched, with {name}/{url} substituted and every bracketed
// placeholder ([TEL], [3 business days]/[3営業日]) left exactly as written —
// confirmed in plan review: no config value is substituted for [TEL].
export function staffHtml(formType: FormType, p: FormPayload, locale?: string): string {
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
    ${p.url ? `<p><strong>Website:</strong> ${p.url}</p>` : ''}
    ${p.phone ? `<p><strong>Phone:</strong> ${p.phone}</p>` : ''}
    ${p.industry ? `<p><strong>Industry:</strong> ${p.industry}</p>` : ''}
    ${p.bookingSystem ? `<p><strong>Current booking system:</strong> ${p.bookingSystem}</p>` : ''}
    ${p.lineAccount ? `<p><strong>LINE Official Account:</strong> ${p.lineAccount}</p>` : ''}
    ${p.problem && p.problem.length > 0 ? `<p><strong>Main problems:</strong> ${p.problem.join(', ')}</p>` : ''}
    ${p.contactPref ? `<p><strong>Preferred contact:</strong> ${p.contactPref}</p>` : ''}
    ${p.message ? `<hr><p><strong>Message:</strong></p><p>${p.message.replace(/\n/g, '<br>')}</p>` : ''}
    <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
  `
}

export function confirmationHtml(formType: FormType, name: string, locale?: string, payload?: FormPayload): string {
  if (formType === 'assessment') {
    const url = payload?.url ?? ''
    if (locale === 'ja') {
      return `
        <p>${name} 様</p>
        <p>このたびは、無料AIホームページ診断にお申し込みいただき、誠にありがとうございます。以下のホームページについて、[3営業日]以内にレポートをお送りいたします。</p>
        <p>ホームページ：${url}</p>
        <p>ご不明な点がございましたら、このメールにご返信いただくか、LINEでお気軽にご連絡ください。</p>
        <p>TechMirai [TEL]・info@techmirai-ai.com・www.techmirai-ai.com</p>
      `
    }
    return `
      <p>Dear ${name},</p>
      <p>Thank you for requesting a Free AI Website Assessment. We have received the website below and will send your report within [3 business days].</p>
      <p>Website: ${url}</p>
      <p>If you have questions in the meantime, simply reply to this email or message us on LINE.</p>
      <p>TechMirai [TEL] · info@techmirai-ai.com · www.techmirai-ai.com</p>
    `
  }

  const copy: Record<Exclude<FormType, 'assessment'>, string> = {
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

export function staffSubject(formType: FormType, p: FormPayload): string {
  if (formType === 'assessment') {
    return `New Free AI Website Assessment request from ${p.name ?? 'Unknown'}`
  }

  const targets: Record<Exclude<FormType, 'assessment'>, string> = {
    contact: `New contact inquiry from ${p.name ?? 'Unknown'}`,
    'job-apply': `New job application from ${p.name ?? 'Unknown'} — ${p.jobSlug ?? ''}`,
    seminar: `New seminar registration from ${p.name ?? 'Unknown'} — ${p.seminarSlug ?? ''}`,
    download: `Download request from ${p.name ?? 'Unknown'} — ${p.resourceSlug ?? ''}`,
  }
  return targets[formType]
}

export function confirmationSubject(formType: FormType, locale?: string): string {
  if (formType === 'assessment') {
    return locale === 'ja'
      ? '【TechMirai】無料AIホームページ診断のお申し込みを受け付けました'
      : 'We received your Free AI Website Assessment request'
  }

  const subjects: Record<Exclude<FormType, 'assessment'>, string> = {
    contact: 'We received your enquiry',
    'job-apply': 'Application received',
    seminar: 'Seminar registration confirmed',
    download: 'Your download request',
  }
  return subjects[formType]
}

// Pack-4/J1: deliberately NO `?? config.contactRecipient` fallback for
// 'assessment' — confirmed in plan review. A misconfigured/missing
// assessmentRecipient must make the caller skip the staff email loudly,
// never silently misdirect a business lead notification to an unrelated
// inbox.
export function resolveStaffRecipient(formType: FormType, config: EmailConfig): string | undefined {
  if (formType === 'job-apply') return config.jobApplicationRecipient
  if (formType === 'seminar') return config.seminarRecipient
  if (formType === 'assessment') return config.assessmentRecipient
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

    // Staff notification — skipped (loudly) rather than misdirected when no
    // recipient is configured for this formType (currently only reachable
    // for 'assessment'; every other formType always resolves to a real
    // address).
    if (staffTo) {
      void dispatch(staffTo, staffSubject(formType, payload), staffHtml(formType, payload, locale), emailConfig.fromEmail)
    } else {
      console.error(
        `[send-form-emails] No staff recipient configured for formType "${formType}" — skipping staff notification for this submission. ` +
          (formType === 'assessment' ? 'Configure site.config.ts forms.assessmentRecipient.' : ''),
      )
    }

    // Auto-reply to user — always attempted, independent of the staff
    // notification outcome above.
    void dispatch(userEmail, confirmationSubject(formType, locale), confirmationHtml(formType, userName, locale, payload), emailConfig.fromEmail)

    return doc
  }
}
