import { escapeHtml, formatDateTime, resolveLocale, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface CancellationTemplateInput {
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
 * STEP 2 Part 4 item 4 — the customer-facing cancellation notification WO-5
 * never sent (Part 3's investigation found only a staff alert). No
 * manage-link here, unlike customer-confirmation.ts: there is nothing left
 * to manage once an appointment is cancelled.
 */
export function renderCustomerCancellation(input: CancellationTemplateInput): RenderedMessage {
  const locale = resolveLocale(input.locale)
  const patientName = escapeHtml(input.patientName)
  const serviceName = escapeHtml(input.serviceName)
  const dateTime = formatDateTime(input.scheduledAt, locale)
  const visitType = VISIT_TYPE_LABEL[locale][input.visitType]

  if (locale === 'ja') {
    return {
      subject: 'ご予約キャンセルのお知らせ',
      html: wrapEmailBody(`
        <p>${patientName} 様</p>
        <p>以下のご予約はキャンセルされました。</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
          <tr><td style="padding:4px 0;color:#71717a;">診療内容</td><td style="padding:4px 0;">${serviceName}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">日時</td><td style="padding:4px 0;">${dateTime}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">区分</td><td style="padding:4px 0;">${visitType}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">予約番号</td><td style="padding:4px 0;">${input.confirmationCode}</td></tr>
        </table>
      `),
      text: [
        `${input.patientName} 様`,
        '以下のご予約はキャンセルされました。',
        `診療内容: ${input.serviceName}`,
        `日時: ${dateTime}`,
        `区分: ${visitType}`,
        `予約番号: ${input.confirmationCode}`,
      ].join('\n'),
    }
  }

  return {
    subject: 'Your appointment has been cancelled',
    html: wrapEmailBody(`
      <p>Hi ${patientName},</p>
      <p>The following appointment has been cancelled.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="padding:4px 0;color:#71717a;">Service</td><td style="padding:4px 0;">${serviceName}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Date &amp; time</td><td style="padding:4px 0;">${dateTime}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Visit type</td><td style="padding:4px 0;">${visitType}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Confirmation code</td><td style="padding:4px 0;">${input.confirmationCode}</td></tr>
      </table>
    `),
    text: [
      `Hi ${input.patientName},`,
      'The following appointment has been cancelled.',
      `Service: ${input.serviceName}`,
      `Date & time: ${dateTime}`,
      `Visit type: ${visitType}`,
      `Confirmation code: ${input.confirmationCode}`,
    ].join('\n'),
  }
}
