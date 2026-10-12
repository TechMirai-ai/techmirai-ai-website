import { isLocalDevelopmentEnv } from './customer-send-policy'

export interface StaffRecipientInput {
  /** The real staff inbox from site config (`forms.appointmentRecipient`). */
  configured: string
  /** `DEV_STAFF_NOTIFICATION_RECIPIENT` — only ever honoured in development. */
  devOverride: string | undefined
  /** `process.env.NODE_ENV`. */
  nodeEnv: string | undefined
}

export interface StaffRecipientResolution {
  /** Where staff booking emails go; `null` means "send none". */
  recipient: string | null
  /** Why no email will be sent. Never contains an address. Only set when `recipient` is null. */
  note?: string
}

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Lower-cased address with any "+tag" removed from the local part, so an alias
 * such as `info+test@…` is recognised as the real `info@…` inbox (plus-addresses
 * land in the same mailbox).
 */
function canonicalAddress(address: string): string {
  const [local = '', domain = ''] = address.trim().toLowerCase().split('@')
  return `${local.split('+')[0]}@${domain}`
}

/**
 * Picks the staff-notification recipient.
 *
 * - In development the real inbox is NEVER used: the override is required, and
 *   without a valid one (or if it equals the real inbox) no staff email is
 *   sent. That is the fail-closed part — a developer's test booking must not be
 *   able to reach the real staff inbox by forgetting to set the override.
 * - Everywhere else the override is ignored outright, so a stray value in a
 *   production environment can never redirect real staff notifications.
 *
 * Pure: it does no I/O and never logs, and the notes it returns never contain
 * an address.
 */
export function resolveStaffRecipient(input: StaffRecipientInput): StaffRecipientResolution {
  if (!isLocalDevelopmentEnv(input.nodeEnv)) {
    return { recipient: input.configured }
  }

  const override = input.devOverride?.trim() ?? ''
  if (!override) {
    return {
      recipient: null,
      note: 'DEV_STAFF_NOTIFICATION_RECIPIENT is not set, so staff notifications are withheld in development',
    }
  }
  if (!SIMPLE_EMAIL.test(override)) {
    return {
      recipient: null,
      note: 'DEV_STAFF_NOTIFICATION_RECIPIENT is not a valid email address, so staff notifications are withheld in development',
    }
  }
  if (canonicalAddress(override) === canonicalAddress(input.configured)) {
    return {
      recipient: null,
      note: 'DEV_STAFF_NOTIFICATION_RECIPIENT equals the real staff inbox (or an alias of it), so staff notifications are withheld in development',
    }
  }
  return { recipient: override }
}
