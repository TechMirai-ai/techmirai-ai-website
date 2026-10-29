import type { CollectionAfterChangeHook } from 'payload'
import { escapeHtml as esc, redactPii } from '../lib/redact'

interface EmailConfig {
  contactRecipient: string
  jobApplicationRecipient: string
  seminarRecipient: string
  // Pack-4/J1: intentionally optional, no default — see resolveStaffRecipient.
  assessmentRecipient?: string
  fromEmail: string
}

type FormType = 'contact' | 'job-apply' | 'seminar' | 'download' | 'assessment' | 'demo-register'

// Types with their own bilingual copy, handled before the generic English tables below.
type CustomCopyFormType = 'assessment' | 'demo-register'

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
  // Voice-pivot /contact additions.
  role?: string
  inquiryPath?: string
  callVolume?: string
  hoursToCover?: string
  languages?: string
  goal?: string
  consentAt?: string
}

// ---------------------------------------------------------------------------
// Email dispatch (non-blocking)
// ---------------------------------------------------------------------------

async function dispatch(
  to: string,
  subject: string,
  html: string,
  fromEmail: string,
  replyTo: string,
): Promise<void> {
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
        replyTo,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      // Provider error text can echo the recipient: redact before logging.
      console.error(`Resend API error (${response.status}):`, redactPii(error))
    } else {
      // Subjects carry the submitter's name, so nothing identifying is logged.
      console.log('✅ Email sent')
    }
  } catch (err) {
    console.error('Failed to send email via Resend:', redactPii(err instanceof Error ? err.message : String(err)))
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
    ${p.name ? `<p><strong>Name:</strong> ${esc(p.name)}</p>` : ''}
    ${p.email ? `<p><strong>Email:</strong> ${esc(p.email)}</p>` : ''}
    ${p.company ? `<p><strong>Company:</strong> ${esc(p.company)}</p>` : ''}
    ${p.role ? `<p><strong>Role:</strong> ${esc(p.role)}</p>` : ''}
    ${p.inquiryType ? `<p><strong>Inquiry Type:</strong> ${esc(p.inquiryType)}</p>` : ''}
    ${p.callVolume ? `<p><strong>Call volume:</strong> ${esc(p.callVolume)}</p>` : ''}
    ${p.hoursToCover ? `<p><strong>Hours to cover:</strong> ${esc(p.hoursToCover)}</p>` : ''}
    ${p.languages ? `<p><strong>Languages:</strong> ${esc(p.languages)}</p>` : ''}
    ${p.consentAt ? `<p><strong>Consent given at:</strong> ${esc(p.consentAt)}</p>` : ''}
    ${p.jobSlug ? `<p><strong>Job:</strong> ${esc(p.jobSlug)}</p>` : ''}
    ${p.seminarSlug ? `<p><strong>Seminar:</strong> ${esc(p.seminarSlug)}</p>` : ''}
    ${p.resourceSlug ? `<p><strong>Resource:</strong> ${esc(p.resourceSlug)}</p>` : ''}
    ${p.url ? `<p><strong>Website:</strong> ${esc(p.url)}</p>` : ''}
    ${p.phone ? `<p><strong>Phone:</strong> ${esc(p.phone)}</p>` : ''}
    ${p.industry ? `<p><strong>Industry:</strong> ${esc(p.industry)}</p>` : ''}
    ${p.bookingSystem ? `<p><strong>Current booking system:</strong> ${esc(p.bookingSystem)}</p>` : ''}
    ${p.lineAccount ? `<p><strong>LINE Official Account:</strong> ${esc(p.lineAccount)}</p>` : ''}
    ${p.problem && p.problem.length > 0 ? `<p><strong>Main problems:</strong> ${esc(p.problem.join(', '))}</p>` : ''}
    ${p.contactPref ? `<p><strong>Preferred contact:</strong> ${esc(p.contactPref)}</p>` : ''}
    ${p.message ? `<hr><p><strong>Message:</strong></p><p>${esc(p.message).replace(/\n/g, '<br>')}</p>` : ''}
    <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
  `
}

export function confirmationHtml(formType: FormType, rawName: string, locale?: string, payload?: FormPayload): string {
  // The submitter's own text goes into the auto-reply: escape it.
  const name = esc(rawName)
  if (formType === 'assessment') {
    const url = esc(payload?.url ?? '')
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

  if (formType === 'demo-register') {
    // DRAFT Japanese (native review needed). No response time or key is promised:
    // neither has been confirmed by the owner.
    if (locale === 'ja') {
      return `
        <p>${name} 様</p>
        <p>TechMirai ライブデモにご登録いただき、ありがとうございます。ご登録内容を受け付けました。</p>
        <p>— TechMirai チーム</p>
      `
    }
    return `
      <p>Hi ${name},</p>
      <p>Thank you for registering for the TechMirai live demo. We have received your details.</p>
      <p>— The Team</p>
    `
  }

  const copy: Record<Exclude<FormType, CustomCopyFormType>, string> = {
    // No response time: the owner has not confirmed one (ECC prompt v2).
    contact:
      'Thank you for contacting TechMirai. Your message was sent successfully. We have received your enquiry and will get back to you as soon as we can.',
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

  if (formType === 'demo-register') {
    return `New live demo registration from ${p.name ?? 'Unknown'}`
  }

  const targets: Record<Exclude<FormType, CustomCopyFormType>, string> = {
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

  if (formType === 'demo-register') {
    // JA is DRAFT (native review needed).
    return locale === 'ja'
      ? '【TechMirai】ライブデモのご登録を受け付けました'
      : 'We received your live demo registration'
  }

  const subjects: Record<Exclude<FormType, CustomCopyFormType>, string> = {
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
    // Awaited below, not fire-and-forget: serverless platforms (Vercel) freeze
    // the function once the response is sent, which would cut off the Resend
    // calls. dispatch() never throws, so a mail failure cannot fail the submission.
    const sends: Promise<void>[] = []

    // Staff notification — skipped (loudly) rather than misdirected when no
    // recipient is configured for this formType (currently only reachable
    // for 'assessment'; every other formType always resolves to a real
    // address).
    if (staffTo) {
      // Reply-To is the submitter so staff can answer the visitor directly;
      // the From address must stay a verified sender (cannot be the visitor's).
      sends.push(
        dispatch(staffTo, staffSubject(formType, payload), staffHtml(formType, payload, locale), emailConfig.fromEmail, userEmail),
      )
    } else {
      console.error(
        `[send-form-emails] No staff recipient configured for formType "${formType}" — skipping staff notification for this submission. ` +
          (formType === 'assessment' ? 'Configure site.config.ts forms.assessmentRecipient.' : ''),
      )
    }

    // Auto-reply to user — always attempted, independent of the staff
    // notification outcome above.
    // A reply to the auto-reply goes to staff when a recipient is configured.
    sends.push(
      dispatch(
        userEmail,
        confirmationSubject(formType, locale),
        confirmationHtml(formType, userName, locale, payload),
        emailConfig.fromEmail,
        staffTo ?? emailConfig.fromEmail,
      ),
    )

    await Promise.allSettled(sends)

    return doc
  }
}
