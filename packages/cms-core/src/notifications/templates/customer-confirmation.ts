import { escapeHtml, formatDate, formatTime, resolveLocale, wrapEmailBody } from './shared'
import type { RenderedMessage } from './shared'

export interface ConfirmationTemplateInput {
  locale: string | null | undefined
  patientName: string
  serviceName: string
  scheduledAt: string
  confirmationCode: string
  // Customer-facing "manage your appointment" link (cancel/reschedule),
  // carrying the expiring linkToken — see tokens.ts's deriveLinkToken. Never
  // the raw, permanent access_token in an emailed URL.
  manageUrl: string
  // True when this confirmation is the result of a reschedule rather than a
  // new booking — adds a one-line lead-in and the "rescheduled" subject; the
  // Spec 12.4 body ("Your {service} is booked for {date} at {time}") is equally
  // true for the new time.
  isReschedule?: boolean
  // Spec 12.4: the meeting tool (Google Meet, Zoom or Teams) is still a
  // CONFIRM item. While false, the literal bracketed placeholder line below is
  // appended; notifications/service.ts additionally withholds production sends.
  meetingToolConfirmed?: boolean
}

// Literal placeholders — never reworded, never translated (CLAUDE.md rules 5–6).
export const MEETING_TOOL_PLACEHOLDER = {
  en: '[Meeting tool — CONFIRM: Google Meet, Zoom or Teams]',
  ja: '[JA TODO]',
} as const

// Pre-J2 reschedule lead-in, kept (not Spec copy) so a rescheduled booking is
// still recognisable as one; the Spec 12.4 body follows it unchanged.
const RESCHEDULE_INTRO = {
  en: 'Your appointment has been rescheduled.',
  ja: '以下の内容でご予約を変更しました。',
} as const

export function renderCustomerConfirmation(input: ConfirmationTemplateInput): RenderedMessage {
  const locale = resolveLocale(input.locale)
  const date = formatDate(input.scheduledAt, locale)
  const time = formatTime(input.scheduledAt)
  const isReschedule = input.isReschedule ?? false
  const showPlaceholder = !(input.meetingToolConfirmed ?? false)
  const placeholder = MEETING_TOOL_PLACEHOLDER[locale]
  const patientName = escapeHtml(input.patientName)
  const manageUrl = escapeHtml(input.manageUrl)

  if (locale === 'ja') {
    // Spec 12.4 (JA), with {service}/{date}/{time} substituted.
    const body = `${date} ${time}に${input.serviceName}のご予約を承りました。面談用のURLは、事前にメールでお送りします。変更・キャンセルは、確認通知内のリンクから行えます。`
    const intro = isReschedule ? [RESCHEDULE_INTRO.ja] : []
    const lines = [`${input.patientName} 様`, ...intro, body, ...(showPlaceholder ? [placeholder] : [])]
    return {
      subject: isReschedule ? 'ご予約変更のお知らせ' : 'ご予約確定のお知らせ',
      html: wrapEmailBody(`
        <p>${patientName} 様</p>
        ${intro.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
        <p>${escapeHtml(body)}</p>
        ${showPlaceholder ? `<p>${escapeHtml(placeholder)}</p>` : ''}
        <p>予約番号: ${input.confirmationCode}</p>
        <p><a href="${manageUrl}" style="color:#2563eb;">ご予約の変更・キャンセルはこちら</a></p>
      `),
      text: [...lines, `予約番号: ${input.confirmationCode}`, `ご予約の変更・キャンセル: ${input.manageUrl}`].join('\n'),
      lineText: [...lines, `予約番号: ${input.confirmationCode}`].join('\n'),
    }
  }

  // Spec 12.4 (EN), with {service}/{date}/{time} substituted.
  const body = `Your ${input.serviceName} is booked for ${date} at ${time} (JST). We will send the meeting link by email before the call. To change or cancel, use the link in your confirmation.`
  const intro = isReschedule ? [RESCHEDULE_INTRO.en] : []
  const lines = [`Hi ${input.patientName},`, ...intro, body, ...(showPlaceholder ? [placeholder] : [])]
  return {
    subject: isReschedule ? 'Your appointment has been rescheduled' : 'Your appointment is confirmed',
    html: wrapEmailBody(`
      <p>Hi ${patientName},</p>
      ${intro.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
      <p>${escapeHtml(body)}</p>
      ${showPlaceholder ? `<p>${escapeHtml(placeholder)}</p>` : ''}
      <p>Confirmation code: ${input.confirmationCode}</p>
      <p><a href="${manageUrl}" style="color:#2563eb;">Manage or cancel your appointment</a></p>
    `),
    text: [...lines, `Confirmation code: ${input.confirmationCode}`, `Manage or cancel your appointment: ${input.manageUrl}`].join('\n'),
    // LINE users reach manage/cancel via the rich menu's own button, not
    // this link — see the `lineText` field's doc comment in shared.ts.
    lineText: [...lines, `Confirmation code: ${input.confirmationCode}`].join('\n'),
  }
}
