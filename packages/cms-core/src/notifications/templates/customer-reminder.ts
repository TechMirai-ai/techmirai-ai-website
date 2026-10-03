import { escapeHtml, formatDateTime, resolveLocale, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface ReminderTemplateInput {
  locale: string | null | undefined
  patientName: string
  serviceName: string
  scheduledAt: string
  visitType: 'first' | 'return'
  confirmationCode: string
}

const VISIT_TYPE_LABEL = {
  ja: { first: '初診', return: '再診' },
  en: { first: 'First visit', return: 'Return visit' },
} as const

/**
 * This normally goes out "the day before, at a configured hour" — but a
 * same-day/short-notice booking can compute a `scheduledFor` already in the
 * past, so the cron delivers it same-day instead (see due-notifications.ts).
 * Copy is deliberately lead-time-agnostic ("you have an upcoming
 * appointment") — never "tomorrow" — so it reads correctly either way.
 */
export function renderCustomerReminder(input: ReminderTemplateInput): RenderedMessage {
  const locale = resolveLocale(input.locale)
  const patientName = escapeHtml(input.patientName)
  const serviceName = escapeHtml(input.serviceName)
  const dateTime = formatDateTime(input.scheduledAt, locale)
  const visitType = VISIT_TYPE_LABEL[locale][input.visitType]

  if (locale === 'ja') {
    return {
      subject: 'ご予約のお知らせ',
      html: wrapEmailBody(`
        <p>${patientName} 様</p>
        <p>ご予約が近づいております。ご確認ください。</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
          <tr><td style="padding:4px 0;color:#71717a;">診療内容</td><td style="padding:4px 0;">${serviceName}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">日時</td><td style="padding:4px 0;">${dateTime}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">区分</td><td style="padding:4px 0;">${visitType}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">予約番号</td><td style="padding:4px 0;">${input.confirmationCode}</td></tr>
        </table>
      `),
      text: [
        `${input.patientName} 様`,
        'ご予約が近づいております。ご確認ください。',
        `診療内容: ${input.serviceName}`,
        `日時: ${dateTime}`,
        `区分: ${visitType}`,
        `予約番号: ${input.confirmationCode}`,
      ].join('\n'),
    }
  }

  return {
    subject: 'Reminder: you have an upcoming appointment',
    html: wrapEmailBody(`
      <p>Hi ${patientName},</p>
      <p>You have an upcoming appointment. Here are the details:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="padding:4px 0;color:#71717a;">Service</td><td style="padding:4px 0;">${serviceName}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Date &amp; time</td><td style="padding:4px 0;">${dateTime}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Visit type</td><td style="padding:4px 0;">${visitType}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Confirmation code</td><td style="padding:4px 0;">${input.confirmationCode}</td></tr>
      </table>
    `),
    text: [
      `Hi ${input.patientName},`,
      'You have an upcoming appointment. Here are the details:',
      `Service: ${input.serviceName}`,
      `Date & time: ${dateTime}`,
      `Visit type: ${visitType}`,
      `Confirmation code: ${input.confirmationCode}`,
    ].join('\n'),
  }
}
