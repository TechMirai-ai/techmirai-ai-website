import { escapeHtml, formatDateTime, resolveLocale, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface ConfirmationTemplateInput {
  locale: string | null | undefined
  patientName: string
  serviceName: string
  scheduledAt: string
  visitType: 'first' | 'return'
  confirmationCode: string
  // Customer-facing "manage your appointment" link (cancel/reschedule),
  // carrying the expiring linkToken — see tokens.ts's deriveLinkToken. Never
  // the raw, permanent access_token in an emailed URL.
  manageUrl: string
  // True when this confirmation is the result of a reschedule rather than a
  // new booking — swaps in "rescheduled" copy instead of "confirmed" copy.
  // Reuses this same template/email rather than a separate one, since the
  // underlying content (service/date/time/code/manage-link) is identical.
  isReschedule?: boolean
}

const VISIT_TYPE_LABEL = {
  ja: { first: '初診', return: '再診' },
  en: { first: 'First visit', return: 'Return visit' },
} as const

export function renderCustomerConfirmation(input: ConfirmationTemplateInput): RenderedMessage {
  const locale = resolveLocale(input.locale)
  const patientName = escapeHtml(input.patientName)
  const serviceName = escapeHtml(input.serviceName)
  const dateTime = formatDateTime(input.scheduledAt, locale)
  const visitType = VISIT_TYPE_LABEL[locale][input.visitType]
  const isReschedule = input.isReschedule ?? false
  const manageUrl = escapeHtml(input.manageUrl)

  if (locale === 'ja') {
    return {
      subject: isReschedule ? 'ご予約変更のお知らせ' : 'ご予約確定のお知らせ',
      html: wrapEmailBody(`
        <p>${patientName} 様</p>
        <p>${isReschedule ? '以下の内容でご予約を変更しました。' : '以下の内容でご予約が確定しました。'}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
          <tr><td style="padding:4px 0;color:#71717a;">診療内容</td><td style="padding:4px 0;">${serviceName}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">日時</td><td style="padding:4px 0;">${dateTime}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">区分</td><td style="padding:4px 0;">${visitType}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">予約番号</td><td style="padding:4px 0;">${input.confirmationCode}</td></tr>
        </table>
        <p><a href="${manageUrl}" style="color:#2563eb;">ご予約の変更・キャンセルはこちら</a></p>
      `),
      text: [
        `${input.patientName} 様`,
        isReschedule ? '以下の内容でご予約を変更しました。' : '以下の内容でご予約が確定しました。',
        `診療内容: ${input.serviceName}`,
        `日時: ${dateTime}`,
        `区分: ${visitType}`,
        `予約番号: ${input.confirmationCode}`,
        `ご予約の変更・キャンセル: ${input.manageUrl}`,
      ].join('\n'),
      // LINE users reach manage/cancel via the rich menu's own button, not
      // this link — see the `lineText` field's doc comment in shared.ts.
      lineText: [
        `${input.patientName} 様`,
        isReschedule ? '以下の内容でご予約を変更しました。' : '以下の内容でご予約が確定しました。',
        `診療内容: ${input.serviceName}`,
        `日時: ${dateTime}`,
        `区分: ${visitType}`,
        `予約番号: ${input.confirmationCode}`,
      ].join('\n'),
    }
  }

  return {
    subject: isReschedule ? 'Your appointment has been rescheduled' : 'Your appointment is confirmed',
    html: wrapEmailBody(`
      <p>Hi ${patientName},</p>
      <p>${
        isReschedule
          ? 'Your appointment has been rescheduled. Here are your new details.'
          : 'Your appointment has been confirmed with the following details.'
      }</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td style="padding:4px 0;color:#71717a;">Service</td><td style="padding:4px 0;">${serviceName}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Date &amp; time</td><td style="padding:4px 0;">${dateTime}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Visit type</td><td style="padding:4px 0;">${visitType}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Confirmation code</td><td style="padding:4px 0;">${input.confirmationCode}</td></tr>
      </table>
      <p><a href="${manageUrl}" style="color:#2563eb;">Manage or cancel your appointment</a></p>
    `),
    text: [
      `Hi ${input.patientName},`,
      isReschedule
        ? 'Your appointment has been rescheduled. Here are your new details.'
        : 'Your appointment has been confirmed with the following details.',
      `Service: ${input.serviceName}`,
      `Date & time: ${dateTime}`,
      `Visit type: ${visitType}`,
      `Confirmation code: ${input.confirmationCode}`,
      `Manage or cancel your appointment: ${input.manageUrl}`,
    ].join('\n'),
    // LINE users reach manage/cancel via the rich menu's own button, not
    // this link — see the `lineText` field's doc comment in shared.ts.
    lineText: [
      `Hi ${input.patientName},`,
      isReschedule
        ? 'Your appointment has been rescheduled. Here are your new details.'
        : 'Your appointment has been confirmed with the following details.',
      `Service: ${input.serviceName}`,
      `Date & time: ${dateTime}`,
      `Visit type: ${visitType}`,
      `Confirmation code: ${input.confirmationCode}`,
    ].join('\n'),
  }
}
