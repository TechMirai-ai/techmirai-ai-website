export { createDispatcher } from './dispatcher'
export type {
  ChannelSendResult,
  NotificationChannel,
  NotificationChannelId,
  NotificationDispatcher,
  NotificationRecord,
  OutboundMessage,
} from './types'

export { EmailResendChannel } from './channels/email-resend'
export { LineMessagingChannel } from './channels/line-messaging'

export { resolveNotificationChannel } from './channel-selection'
export type { ChannelSelectionCustomer } from './channel-selection'

export { attemptSend, MAX_SEND_ATTEMPTS } from './send'

export { fetchDueNotifications } from './due-notifications'

export { createNotificationIfAbsent, isDuplicateKeyError } from './dedupe-insert'
export type { CreateNotificationInput, CreateNotificationResult } from './dedupe-insert'

export { computeReminderScheduledFor } from './reminder-schedule'

export {
  CUSTOMER_EMAIL_WITHHELD_REASON,
  customerEmailsAllowed,
  isCustomerFacingTemplateKey,
  isLocalDevelopmentEnv,
  markNotificationsWithheld,
  partitionDueNotifications,
} from './customer-send-policy'
export type { DuePartition } from './customer-send-policy'

export { resolveStaffRecipient } from './staff-recipient'
export type { StaffRecipientInput, StaffRecipientResolution } from './staff-recipient'

export { notifyBookingCancelled, notifyBookingCreated } from './service'
export type { NotificationRuntimeConfig, NotifyBookingInput } from './service'

export {
  applyNotificationIndexes,
  dropNotificationIndexes,
  up as notificationIndexesUp,
  down as notificationIndexesDown,
} from './migrations/notification-indexes'
export type { DdlExecutor } from './migrations/notification-indexes'
