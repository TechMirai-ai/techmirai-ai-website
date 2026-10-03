import { escapeHtml, formatDateTime, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface StaffAppointmentTemplateInput {
  event: 'created' | 'cancelled'
  patientName: string
  serviceName: string
  scheduledAt: string
  visitType: 'first' | 'return'
  appointmentId: number | string
  adminBaseUrl: string
}

const VISIT_TYPE_LABEL = { first: 'First visit', return: 'Return visit' } as const

const EVENT_COPY = {
  created: { subject: 'New booking', heading: 'A new appointment was booked.' },
  cancelled: { subject: 'Booking cancelled — slot freed up', heading: 'An appointment was cancelled.' },
} as const

/**
 * Staff templates have no locale concern — staff use whatever language the
 * clinic operates in — so there's deliberately no `locale` field here, unlike
 * the customer-facing templates. One template, parameterized by `event`.
 */
export function renderStaffAppointment(input: StaffAppointmentTemplateInput): RenderedMessage {
  const patientName = escapeHtml(input.patientName)
  const serviceName = escapeHtml(input.serviceName)
  const dateTime = formatDateTime(input.scheduledAt, 'en')
  const visitType = VISIT_TYPE_LABEL[input.visitType]
  const copy = EVENT_COPY[input.event]
  const adminUrl = `${input.adminBaseUrl}/admin/collections/appointments/${input.appointmentId}`

  return {
    subject: copy.subject,
    html: wrapEmailBody(`
      <p>${copy.heading}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="padding:4px 0;color:#71717a;">Patient</td><td style="padding:4px 0;">${patientName}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Service</td><td style="padding:4px 0;">${serviceName}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Date &amp; time</td><td style="padding:4px 0;">${dateTime}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Visit type</td><td style="padding:4px 0;">${visitType}</td></tr>
      </table>
      <p><a href="${adminUrl}" style="color:#2563eb;">View appointment in admin</a></p>
    `),
    text: [
      copy.heading,
      `Patient: ${input.patientName}`,
      `Service: ${input.serviceName}`,
      `Date & time: ${dateTime}`,
      `Visit type: ${visitType}`,
      `Admin link: ${adminUrl}`,
    ].join('\n'),
  }
}
