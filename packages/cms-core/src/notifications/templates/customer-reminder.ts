import { escapeHtml, formatDate, formatTime, resolveLocale, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface ReminderTemplateInput {
  locale: string | null | undefined
  patientName: string
  serviceName: string
  scheduledAt: string
  confirmationCode: string
}

/**
 * Spec 12.4 reminder copy. The send time is decided by notifications/
 * reminder-schedule.ts (and may be same-day for a short-notice booking), so
 * the copy stays lead-time-agnostic exactly as the Spec words it.
 */
export function renderCustomerReminder(input: ReminderTemplateInput): RenderedMessage {
  const locale = resolveLocale(input.locale)
  const date = formatDate(input.scheduledAt, locale)
  const time = formatTime(input.scheduledAt)
  const patientName = escapeHtml(input.patientName)

  if (locale === 'ja') {
    const body = `リマインド：TechMiraiとの${input.serviceName}は${date} ${time}からです。`
    return {
      subject: 'ご予約のお知らせ',
      html: wrapEmailBody(`
        <p>${patientName} 様</p>
        <p>${escapeHtml(body)}</p>
        <p>予約番号: ${input.confirmationCode}</p>
      `),
      text: [`${input.patientName} 様`, body, `予約番号: ${input.confirmationCode}`].join('\n'),
    }
  }

  const body = `Reminder: your ${input.serviceName} with TechMirai is coming up on ${date} at ${time}.`
  return {
    subject: 'Reminder: you have an upcoming appointment',
    html: wrapEmailBody(`
      <p>Hi ${patientName},</p>
      <p>${escapeHtml(body)}</p>
      <p>Confirmation code: ${input.confirmationCode}</p>
    `),
    text: [`Hi ${input.patientName},`, body, `Confirmation code: ${input.confirmationCode}`].join('\n'),
  }
}
