import { escapeHtml, formatDate, formatDateTime, formatTime, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface StaffAppointmentTemplateInput {
  event: 'created' | 'cancelled'
  patientName: string
  // Spec 12.4 "Company or shop name"; optional on the customer record.
  company?: string | undefined
  serviceName: string
  scheduledAt: string
  appointmentId: number | string
  adminBaseUrl: string
  // True when the customer confirmation was deliberately not sent (production
  // while booking.meetingToolConfirmed is false) so staff know to follow up.
  customerConfirmationWithheld?: boolean
}

const CANCELLED_HEADING = 'An appointment was cancelled.'

// Operational note, not Spec copy (registered in PLACEHOLDER-REGISTER.md).
const WITHHELD_NOTE =
  'Customer confirmation email was NOT sent (customer emails are disabled outside local development). Contact the customer manually.'

/**
 * Staff templates have no locale concern — the Spec gives both an English and
 * a Japanese staff line for a new booking, so 'created' carries both (EN
 * first). One template, parameterized by `event`. The cancelled event has no
 * Spec text; it keeps the existing wording.
 */
export function renderStaffAppointment(input: StaffAppointmentTemplateInput): RenderedMessage {
  const adminUrl = `${input.adminBaseUrl}/admin/collections/appointments/${input.appointmentId}`
  const withheld = input.customerConfirmationWithheld ?? false
  const company = input.company?.trim() ?? ''

  if (input.event === 'created') {
    const date = formatDate(input.scheduledAt, 'en')
    const jaDate = formatDate(input.scheduledAt, 'ja')
    const time = formatTime(input.scheduledAt)
    // Spec 12.4 staff notification, EN and JA; {company} omitted when blank.
    const en = `New booking: ${input.serviceName}, ${date} ${time}, ${input.patientName}${company ? `, ${company}` : ''}.`
    const ja = `新しい予約：${input.serviceName}、${jaDate} ${time}、${input.patientName}様${company ? `、${company}` : ''}`
    return {
      subject: 'New booking',
      html: wrapEmailBody(`
        <p>${escapeHtml(en)}</p>
        <p>${escapeHtml(ja)}</p>
        ${withheld ? `<p><strong>${escapeHtml(WITHHELD_NOTE)}</strong></p>` : ''}
        <p><a href="${escapeHtml(adminUrl)}" style="color:#2563eb;">View appointment in admin</a></p>
      `),
      text: [en, ja, ...(withheld ? [WITHHELD_NOTE] : []), `Admin link: ${adminUrl}`].join('\n'),
    }
  }

  const dateTime = formatDateTime(input.scheduledAt, 'en')
  const name = escapeHtml(input.patientName)
  const service = escapeHtml(input.serviceName)
  return {
    subject: 'Booking cancelled — slot freed up',
    html: wrapEmailBody(`
      <p>${CANCELLED_HEADING}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="padding:4px 0;color:#71717a;">Name</td><td style="padding:4px 0;">${name}</td></tr>
        ${company ? `<tr><td style="padding:4px 0;color:#71717a;">Company</td><td style="padding:4px 0;">${escapeHtml(company)}</td></tr>` : ''}
        <tr><td style="padding:4px 0;color:#71717a;">Service</td><td style="padding:4px 0;">${service}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Date &amp; time</td><td style="padding:4px 0;">${dateTime}</td></tr>
      </table>
      <p><a href="${escapeHtml(adminUrl)}" style="color:#2563eb;">View appointment in admin</a></p>
    `),
    text: [
      CANCELLED_HEADING,
      `Name: ${input.patientName}`,
      ...(company ? [`Company: ${company}`] : []),
      `Service: ${input.serviceName}`,
      `Date & time: ${dateTime}`,
      `Admin link: ${adminUrl}`,
    ].join('\n'),
  }
}
