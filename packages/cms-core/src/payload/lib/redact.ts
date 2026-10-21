// Voice-pivot (docs/ECC MASTER PROMPT TechMirai Voice Website v2 §2): no
// personal data in application logs, and submitted text must never be able to
// inject markup into the staff notification email. Two small pure helpers.

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
// 8+ digits, optionally separated by spaces, dashes, dots or parentheses, with an optional leading +.
const PHONE = /\+?\d[\d\s().-]{6,}\d/g

/** Masks email addresses and phone numbers in free text before it is logged. */
export function redactPii(text: string): string {
  return text.replace(EMAIL, '[email redacted]').replace(PHONE, '[phone redacted]')
}

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

/** Escapes `& < > "` so user-supplied text is safe inside HTML. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (ch) => HTML_ESCAPES[ch] ?? ch)
}
