import 'server-only'
import { Resend } from 'resend'
import {
  createDispatcher,
  EmailResendChannel,
  isLocalDevelopmentEnv,
  LineMessagingChannel,
  resolveStaffRecipient,
} from '@techmirai/cms-core/notifications'
import type { NotificationDispatcher, NotificationRuntimeConfig } from '@techmirai/cms-core/notifications'

import siteConfig from '../../site.config'
import { getLineAccessToken } from '@/lib/line'

let cachedDispatcher: NotificationDispatcher | null = null

/**
 * The composition root: the one place a channel implementation is
 * constructed and registered. Adding LINE/SMS later means adding one more
 * `NotificationChannel` to this array — nothing else in the app changes.
 */
export function getNotificationDispatcher(): NotificationDispatcher {
  if (!cachedDispatcher) {
    // The Resend SDK throws SYNCHRONOUSLY if constructed with an empty key —
    // which, inside next/server's after(), would abort before
    // notifyBookingCreated ever runs, silently losing every notification for
    // that booking (no row, no retry, no log). An unset key must fail at
    // send time instead (a normal async error attemptSend already retries,
    // logs, and eventually marks failed), never at construction time.
    const resend = new Resend(process.env.RESEND_API_KEY || 'not-configured')
    cachedDispatcher = createDispatcher([
      new EmailResendChannel(resend, siteConfig.integrations.resendFromEmail),
      // getLineAccessToken is passed as a GETTER, not called here — same
      // "fail at send time, not construction time" rationale as the Resend
      // key above, since LINE_CHANNEL_ACCESS_TOKEN is optional for a client
      // that hasn't set up LINE yet.
      new LineMessagingChannel(getLineAccessToken),
    ])
  }
  return cachedDispatcher
}

/** Tenant-specific values, sourced from site.config.ts/env — never hardcoded. */
export function getNotificationRuntimeConfig(): NotificationRuntimeConfig {
  // In development the real staff inbox is never used: staff emails go to
  // DEV_STAFF_NOTIFICATION_RECIPIENT, or are withheld if it isn't set (see
  // cms-core/notifications/staff-recipient.ts). Outside development the
  // override is ignored.
  const staff = resolveStaffRecipient({
    configured: siteConfig.forms.appointmentRecipient ?? siteConfig.forms.contactRecipient,
    devOverride: process.env.DEV_STAFF_NOTIFICATION_RECIPIENT,
    nodeEnv: process.env.NODE_ENV,
  })
  return {
    staffRecipient: staff.recipient,
    staffRecipientNote: staff.note,
    reminderHourLocal: siteConfig.notifications.reminderHourLocal,
    defaultLocale: siteConfig.locales.default,
    adminBaseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
    meetingToolConfirmed: siteConfig.booking.meetingToolConfirmed,
    // Fail closed: only an explicit 'development' counts as local development,
    // and only there are customer booking emails sent (customer-send-policy.ts).
    isLocalDevelopment: isLocalDevelopmentEnv(process.env.NODE_ENV),
  }
}
