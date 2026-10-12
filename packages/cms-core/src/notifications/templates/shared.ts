import { BOOKING_TIME_ZONE } from '../../booking/time-zone'

export type SupportedLocale = 'ja' | 'en'

export interface RenderedMessage {
  subject: string
  html: string
  text: string
  /**
   * LINE-specific variant of `text`, used instead of `text` for the `line`
   * channel only — `text` also doubles as email's plain-text MIME part, so a
   * renderer that wants different copy on LINE (e.g. omitting a link LINE
   * users reach some other way) sets this rather than changing `text`
   * itself. Falls back to `text` when unset (see service.ts).
   */
  lineText?: string
}

/** Only ja/en are supported today; anything else falls back to en (same rule send-form-emails.ts already uses). */
export function resolveLocale(locale: string | null | undefined): SupportedLocale {
  return locale === 'ja' ? 'ja' : 'en'
}

/** Escapes user-supplied text (patient/customer names, service names) before it goes into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Appointment instants are stored in UTC and displayed in the booking zone
 * (Asia/Tokyo, approved decision D2 — see booking/time-zone.ts), which the
 * Spec's "(JST)" confirmation text relies on.
 */
export function formatDateTime(scheduledAtIso: string, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(scheduledAtIso))
}

/**
 * Table-based layout + inline CSS shared by every email template, so it
 * renders correctly on mobile mail clients (many still strip <style>
 * blocks and rely on table-based layout for structure).
 */
export function wrapEmailBody(innerHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;">
            <tr>
              <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#18181b;">
                ${innerHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
