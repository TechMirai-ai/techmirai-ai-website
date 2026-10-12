import { escapeHtml, formatDate, resolveLocale, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface CancellationTemplateInput {
  locale: string | null | undefined
  patientName: string
  serviceName: string
  scheduledAt: string
  confirmationCode: string
}

/**
 * STEP 2 Part 4 item 4 — the customer-facing cancellation notification WO-5
 * never sent (Part 3's investigation found only a staff alert). No
 * manage-link here, unlike customer-confirmation.ts: there is nothing left
 * to manage once an appointment is cancelled. Body is the Spec 12.4 text.
 */
export function renderCustomerCancellation(input: CancellationTemplateInput): RenderedMessage {
  const locale = resolveLocale(input.locale)
  const date = formatDate(input.scheduledAt, locale)
  const patientName = escapeHtml(input.patientName)

  if (locale === 'ja') {
    const body = `${date}の${input.serviceName}をキャンセルしました。またいつでもご予約ください。`
    return {
      subject: 'ご予約キャンセルのお知らせ',
      html: wrapEmailBody(`
        <p>${patientName} 様</p>
        <p>${escapeHtml(body)}</p>
        <p>予約番号: ${input.confirmationCode}</p>
      `),
      text: [`${input.patientName} 様`, body, `予約番号: ${input.confirmationCode}`].join('\n'),
    }
  }

  const body = `Your ${input.serviceName} on ${date} has been cancelled. You can book a new time any time.`
  return {
    subject: 'Your appointment has been cancelled',
    html: wrapEmailBody(`
      <p>Hi ${patientName},</p>
      <p>${escapeHtml(body)}</p>
      <p>Confirmation code: ${input.confirmationCode}</p>
    `),
    text: [`Hi ${input.patientName},`, body, `Confirmation code: ${input.confirmationCode}`].join('\n'),
  }
}
