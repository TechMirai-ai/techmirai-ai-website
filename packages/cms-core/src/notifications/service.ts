import type { Payload } from 'payload'

import { deriveLinkToken } from '../booking/api/tokens'
import { attemptSend } from './send'
import { resolveNotificationChannel } from './channel-selection'
import { createNotificationIfAbsent } from './dedupe-insert'
import { computeReminderScheduledFor } from './reminder-schedule'
import { renderCustomerCancellation } from './templates/customer-cancellation'
import { renderCustomerConfirmation } from './templates/customer-confirmation'
import { renderCustomerReminder } from './templates/customer-reminder'
import { renderStaffAppointment } from './templates/staff-appointment'
import { resolveLocale } from './templates/shared'
import type { SupportedLocale } from './templates/shared'
import type { NotificationChannelId, NotificationDispatcher, NotificationRecord } from './types'
import { CUSTOMER_EMAIL_WITHHELD_REASON, customerEmailsAllowed } from './customer-send-policy'

export type { NotificationDispatcher } from './types'

export interface NotificationRuntimeConfig {
  // `null` means no staff email is sent (see staff-recipient.ts: development
  // without a valid override). `staffRecipientNote` says why, without an address.
  staffRecipient: string | null
  staffRecipientNote?: string | undefined
  reminderHourLocal: number
  defaultLocale: string
  adminBaseUrl: string
  // Spec 12.4: the meeting tool is still a CONFIRM item; while false the
  // confirmation email carries a literal bracketed placeholder line.
  meetingToolConfirmed: boolean
  // Fail closed (customer-send-policy.ts): ALL customer booking emails —
  // confirmation, reminder, cancellation — are sent only when this is true,
  // i.e. only for an explicit `NODE_ENV === 'development'`. Production,
  // staging, test and an unset NODE_ENV withhold them, recording each as a
  // 'skipped' audit row.
  isLocalDevelopment: boolean
}

/**
 * Records that a customer email was deliberately NOT sent (see
 * customer-send-policy.ts): an audit row with status 'skipped' and the reason,
 * and no subject/html/text — so no customer-facing content exists anywhere to
 * leak — plus a log line. Uses the same dedupeKey the real row would, so a
 * retry cannot also create the sendable one.
 */
async function recordWithheldCustomerEmail(
  payload: Payload,
  row: {
    appointment: number | string
    channel: NotificationChannelId
    templateKey: string
    locale: string
    recipient: string
    dedupeKey: string
  },
): Promise<void> {
  await createNotificationIfAbsent(payload, {
    ...row,
    scheduledFor: new Date().toISOString(),
    status: 'skipped',
    lastError: CUSTOMER_EMAIL_WITHHELD_REASON,
  })
  payload.logger.warn(
    `notifications: customer ${row.templateKey} withheld for appointment ${row.appointment} — ${CUSTOMER_EMAIL_WITHHELD_REASON}`,
  )
}

/** Logs (without any address) that the staff email is intentionally not being sent. */
function warnStaffWithheld(payload: Payload, event: string, appointmentId: number | string, note: string | undefined): void {
  payload.logger.warn(
    `notifications: staff ${event} notification withheld for appointment ${appointmentId} — ${note ?? 'no staff recipient resolved'}`,
  )
}

export interface NotifyBookingInput {
  confirmationCode: string
  // True when this call follows a customer-initiated reschedule rather than
  // a new booking — swaps in "rescheduled" copy in the confirmation email.
  isReschedule?: boolean
}

interface AppointmentForNotification {
  id: number | string
  confirmationCode: string
  idempotencyKey: string
  scheduledAt: string
  visitType: 'first' | 'return'
  serviceId: number | string
  customer: {
    id: number | string
    familyName: string
    givenName: string
    company: string | null | undefined
    email: string | undefined
    locale: string | null | undefined
    lineUserId: string | null | undefined
    lineChannelDead: boolean | null | undefined
  }
}

interface RawRelation {
  id: number | string
  [key: string]: unknown
}

async function findAppointmentForNotification(
  payload: Payload,
  confirmationCode: string,
): Promise<AppointmentForNotification | null> {
  const result = await payload.find({
    collection: 'appointments',
    where: { confirmationCode: { equals: confirmationCode } },
    limit: 1,
    depth: 2,
  })
  const doc = result.docs[0] as
    | {
        id: number | string
        confirmationCode: string
        idempotencyKey: string
        scheduledAt: string
        visitType: 'first' | 'return'
        service: RawRelation
        customer: RawRelation & {
          familyName: string
          givenName: string
          company: string | null | undefined
          email: string | undefined
          locale: string | null | undefined
          lineUserId: string | null | undefined
          lineChannelDead: boolean | null | undefined
        }
      }
    | undefined
  if (!doc) return null

  return {
    id: doc.id,
    confirmationCode: doc.confirmationCode,
    idempotencyKey: doc.idempotencyKey,
    scheduledAt: doc.scheduledAt,
    visitType: doc.visitType,
    serviceId: doc.service.id,
    customer: {
      id: doc.customer.id,
      familyName: doc.customer.familyName,
      givenName: doc.customer.givenName,
      company: doc.customer.company,
      email: doc.customer.email,
      locale: doc.customer.locale,
      lineUserId: doc.customer.lineUserId,
      lineChannelDead: doc.customer.lineChannelDead,
    },
  }
}

/**
 * Builds the customer-facing "manage your appointment" link embedded in the
 * confirmation email — carries the expiring linkToken (see tokens.ts's
 * deriveLinkToken), never the raw, permanent access_token.
 */
function buildManageUrl(
  config: NotificationRuntimeConfig,
  locale: SupportedLocale,
  confirmationCode: string,
  idempotencyKey: string,
): string {
  const linkToken = deriveLinkToken(idempotencyKey)
  return `${config.adminBaseUrl}/${locale}/booking/manage?code=${confirmationCode}&token=${linkToken}`
}

/** Localized fields (like bookable-services.name) resolve per the `locale` passed to this call, not the parent query. */
async function fetchServiceName(payload: Payload, serviceId: number | string, locale: string): Promise<string> {
  const service = await payload.findByID({
    collection: 'bookable-services',
    id: serviceId,
    locale,
    depth: 0,
    disableErrors: true,
  })
  return (service?.['name'] as string | undefined) ?? ''
}

function patientDisplayName(customer: AppointmentForNotification['customer']): string {
  return `${customer.familyName} ${customer.givenName}`
}

/**
 * Runs one notification step (render + queue + best-effort send, or a
 * status update) in isolation. An unexpected failure in one step — a
 * template bug, a transient DB error — must not prevent the OTHER
 * independent steps from running: the confirmation, the reminder, and the
 * staff notification are three separate guarantees, not one atomic unit.
 * (Duplicate-key "already queued" outcomes are handled inside
 * createNotificationIfAbsent itself and never reach here as an error.)
 */
async function runNotificationStep(payload: Payload, label: string, step: () => Promise<void>): Promise<void> {
  try {
    await step()
  } catch (err) {
    payload.logger.error(`notifications: ${label} failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function sendCreatedRow(
  payload: Payload,
  dispatcher: NotificationDispatcher,
  result: { created: boolean; id?: number | string },
  row: Omit<NotificationRecord, 'id' | 'attempts'>,
): Promise<void> {
  if (!result.created || result.id === undefined) return
  await attemptSend(payload, dispatcher, { ...row, id: result.id, attempts: 0 })
}

/**
 * Fires immediately after a booking is created: queues (and best-effort
 * sends) the customer confirmation + reminder, and the staff "new booking"
 * notification. Customer rows are skipped entirely when the customer has no
 * email on file — see the "Missing customer email" note in the WO-4 plan.
 */
export async function notifyBookingCreated(
  payload: Payload,
  dispatcher: NotificationDispatcher,
  config: NotificationRuntimeConfig,
  input: NotifyBookingInput,
): Promise<void> {
  const appointment = await findAppointmentForNotification(payload, input.confirmationCode)
  if (!appointment) {
    payload.logger.warn(`notifications: no appointment found for confirmation code ${input.confirmationCode}`)
    return
  }

  const patientName = patientDisplayName(appointment.customer)
  const nowIso = new Date().toISOString()

  // The one shared channel-selection seam every customer-facing call site
  // routes through — see channel-selection.ts. LINE if linked and not
  // known-blocked, otherwise email, otherwise (neither usable) skip, exactly
  // as the email-only version of this function already did. channel and
  // recipient are resolved TOGETHER (not re-derived here with a second
  // channel-dependent branch) so there is exactly one place that can ever
  // disagree with itself about which field to read.
  const resolved = resolveNotificationChannel(appointment.customer)

  // Fail-closed policy (customer-send-policy.ts): customer booking emails are
  // sent only in local development. Each customer step below checks it
  // separately — guarding the confirmation does NOT guard the reminder.
  const customerAllowed = customerEmailsAllowed(config)
  let confirmationWithheld = false

  if (resolved) {
    const { channel: customerChannel, recipient } = resolved
    const customerLocale = resolveLocale(appointment.customer.locale)

    await runNotificationStep(payload, `confirmation for appointment ${appointment.id}`, async () => {
      if (!customerAllowed) {
        confirmationWithheld = true
        await recordWithheldCustomerEmail(payload, {
          appointment: appointment.id,
          channel: customerChannel,
          templateKey: 'booking-confirmation',
          locale: customerLocale,
          recipient,
          dedupeKey: `booking-confirmation:${appointment.id}`,
        })
        return
      }
      const serviceName = await fetchServiceName(payload, appointment.serviceId, customerLocale)
      const manageUrl = buildManageUrl(config, customerLocale, appointment.confirmationCode, appointment.idempotencyKey)
      // Same renderer regardless of channel — its .text is already the
      // plain-text, bilingual (ja/en) copy email needs (both as its
      // plain-text MIME part and, via .lineText, as the LINE push body);
      // .subject/.html simply go unused by LineMessagingChannel, same as
      // any other channel-specific field (see OutboundMessage's doc comment
      // in types.ts).
      const confirmation = renderCustomerConfirmation({
        locale: appointment.customer.locale,
        patientName,
        serviceName,
        scheduledAt: appointment.scheduledAt,
        confirmationCode: appointment.confirmationCode,
        manageUrl,
        isReschedule: input.isReschedule ?? false,
        meetingToolConfirmed: config.meetingToolConfirmed,
      })
      // LINE already has a "Manage" button in the rich menu straight into
      // the LIFF manage flow, so the manage-URL line in .text is redundant
      // clutter there — .lineText is the same copy without it. Email has no
      // such button, so email keeps the full .text (with the link) as-is.
      const confirmationText = customerChannel === 'line' ? (confirmation.lineText ?? confirmation.text) : confirmation.text
      const confirmationRow = {
        appointment: appointment.id,
        channel: customerChannel,
        templateKey: 'booking-confirmation',
        locale: customerLocale,
        recipient,
        subject: confirmation.subject,
        html: confirmation.html,
        text: confirmationText,
        scheduledFor: nowIso,
        // Deliberately NOT channel-prefixed: this must stay the same key
        // across retries of this function for the same appointment even if
        // the resolved channel differs between calls (e.g. a customer links
        // LINE between an original request and a client-side retry with the
        // same idempotency key) — otherwise the DB unique-constraint
        // duplicate guard (see NotificationsCollection's doc comment) stops
        // catching the duplicate and the customer gets two confirmations.
        // `channel` is already its own queryable column for the "which
        // channel was actually used" question (item 6).
        dedupeKey: `booking-confirmation:${appointment.id}`,
      }
      const confirmationResult = await createNotificationIfAbsent(payload, confirmationRow)
      await sendCreatedRow(payload, dispatcher, confirmationResult, confirmationRow)
    })

    // Independent of the confirmation step above — a failure rendering or
    // queueing the confirmation must not also prevent the reminder from
    // being queued (or vice versa).
    await runNotificationStep(payload, `reminder for appointment ${appointment.id}`, async () => {
      // Reminders stay disabled (not queued as pending) until the 24-hour
      // scheduler is implemented and verified — see J2-09. Checked here on its
      // own: the confirmation step's guard does not cover this one.
      if (!customerAllowed) {
        await recordWithheldCustomerEmail(payload, {
          appointment: appointment.id,
          channel: customerChannel,
          templateKey: 'booking-reminder',
          locale: customerLocale,
          recipient,
          dedupeKey: `booking-reminder:${appointment.id}`,
        })
        return
      }
      const serviceName = await fetchServiceName(payload, appointment.serviceId, customerLocale)
      const reminder = renderCustomerReminder({
        locale: appointment.customer.locale,
        patientName,
        serviceName,
        scheduledAt: appointment.scheduledAt,
        confirmationCode: appointment.confirmationCode,
      })
      await createNotificationIfAbsent(payload, {
        appointment: appointment.id,
        channel: customerChannel,
        templateKey: 'booking-reminder',
        locale: customerLocale,
        recipient,
        subject: reminder.subject,
        html: reminder.html,
        text: reminder.text,
        scheduledFor: computeReminderScheduledFor(appointment.scheduledAt, config.reminderHourLocal),
        // Same not-channel-prefixed rationale as the confirmation row above.
        dedupeKey: `booking-reminder:${appointment.id}`,
      })
      // Deliberately not sent here — the reminder is picked up (and, for a
      // same-day booking, sent immediately) by the cron's due-notifications
      // pass, not by this immediate best-effort send. It is ALWAYS a push
      // when the channel is line — there is never an inbound webhook event
      // to reply to at reminder time (STEP2-LINE-CATALOGUE.md Part 0.4).
    })
  } else {
    payload.logger.warn(
      `notifications: no usable notification channel (no email on file, no active LINE link) — customer notifications skipped for appointment ${appointment.id}`,
    )
  }

  // Independent of both customer-facing steps above — the clinic must learn
  // about a new booking even if something went wrong rendering/queueing the
  // customer's own confirmation or reminder.
  const staffRecipient = config.staffRecipient
  if (staffRecipient === null) {
    warnStaffWithheld(payload, 'created', appointment.id, config.staffRecipientNote)
    return
  }
  await runNotificationStep(payload, `staff notification for appointment ${appointment.id}`, async () => {
    const staffServiceName = await fetchServiceName(payload, appointment.serviceId, config.defaultLocale)
    const staff = renderStaffAppointment({
      event: 'created',
      patientName,
      company: appointment.customer.company ?? undefined,
      serviceName: staffServiceName,
      scheduledAt: appointment.scheduledAt,
      appointmentId: appointment.id,
      adminBaseUrl: config.adminBaseUrl,
      customerConfirmationWithheld: confirmationWithheld,
    })
    const staffRow = {
      appointment: appointment.id,
      channel: 'email' as const,
      templateKey: 'staff-appointment-created',
      recipient: staffRecipient,
      subject: staff.subject,
      html: staff.html,
      text: staff.text,
      scheduledFor: nowIso,
      dedupeKey: `email:staff-appointment-created:${appointment.id}`,
    }
    const staffResult = await createNotificationIfAbsent(payload, staffRow)
    await sendCreatedRow(payload, dispatcher, staffResult, staffRow)
  })
}

/**
 * STEP 2 Part 4 item 4 — the customer-facing cancellation notification WO-5
 * never sent (only the staff alert existed before this). Extracted out of
 * notifyBookingCancelled so that function's own body stays readable — this
 * is the one new step it adds. Warns and does nothing when there's no
 * usable channel, same shape as notifyBookingCreated's equivalent gate.
 */
async function sendCustomerCancellationNotification(
  payload: Payload,
  dispatcher: NotificationDispatcher,
  appointment: AppointmentForNotification,
  patientName: string,
  customerAllowed: boolean,
): Promise<void> {
  const resolved = resolveNotificationChannel(appointment.customer)
  if (!resolved) {
    payload.logger.warn(
      `notifications: no usable notification channel (no email on file, no active LINE link) — customer cancellation notification skipped for appointment ${appointment.id}`,
    )
    return
  }

  const { channel: customerChannel, recipient } = resolved
  await runNotificationStep(payload, `customer cancellation notification for appointment ${appointment.id}`, async () => {
    const customerLocale = resolveLocale(appointment.customer.locale)
    // The cancellation itself (data) has already happened; only the email is
    // withheld. Checked here on its own — the confirmation/reminder guards do
    // not cover this one.
    if (!customerAllowed) {
      await recordWithheldCustomerEmail(payload, {
        appointment: appointment.id,
        channel: customerChannel,
        templateKey: 'booking-cancellation',
        locale: customerLocale,
        recipient,
        dedupeKey: `booking-cancellation:${appointment.id}`,
      })
      return
    }
    const serviceName = await fetchServiceName(payload, appointment.serviceId, customerLocale)
    const cancellation = renderCustomerCancellation({
      locale: appointment.customer.locale,
      patientName,
      serviceName,
      scheduledAt: appointment.scheduledAt,
      confirmationCode: appointment.confirmationCode,
    })
    const row = {
      appointment: appointment.id,
      channel: customerChannel,
      templateKey: 'booking-cancellation',
      locale: customerLocale,
      recipient,
      subject: cancellation.subject,
      html: cancellation.html,
      text: cancellation.text,
      scheduledFor: new Date().toISOString(),
      dedupeKey: `booking-cancellation:${appointment.id}`,
    }
    const result = await createNotificationIfAbsent(payload, row)
    await sendCreatedRow(payload, dispatcher, result, row)
  })
}

/**
 * Fires immediately after a cancellation: queues and sends the customer-
 * facing cancellation notification (see sendCustomerCancellationNotification
 * above), queues and sends the staff "slot freed up" notification, and
 * voids any still-pending reminder for this appointment so a cancelled
 * visit never triggers a "see you soon" email.
 *
 * The customer-facing step is skipped when `input.isReschedule` is true:
 * that's the OLD appointment's side-effect cancellation inside a reschedule
 * (see reschedule/route.ts), and that customer already gets the
 * "rescheduled" confirmation via notifyBookingCreated — a second "your
 * appointment was cancelled" message for the same action would be
 * redundant, not informative.
 */
export async function notifyBookingCancelled(
  payload: Payload,
  dispatcher: NotificationDispatcher,
  config: NotificationRuntimeConfig,
  input: NotifyBookingInput,
): Promise<void> {
  const appointment = await findAppointmentForNotification(payload, input.confirmationCode)
  if (!appointment) {
    payload.logger.warn(`notifications: no appointment found for confirmation code ${input.confirmationCode}`)
    return
  }

  const patientName = patientDisplayName(appointment.customer)

  // Independent of every other step below — a failure here must not
  // prevent the staff alert or the reminder-voiding from happening, and
  // vice versa (same isolation discipline as notifyBookingCreated).
  if (!input.isReschedule) {
    await sendCustomerCancellationNotification(payload, dispatcher, appointment, patientName, customerEmailsAllowed(config))
  }

  // Independent of the reminder-skip step below — the clinic must learn a
  // slot freed up even if voiding the reminder fails, and vice versa.
  await runNotificationStep(payload, `staff cancellation notification for appointment ${appointment.id}`, async () => {
    const staffRecipient = config.staffRecipient
    if (staffRecipient === null) {
      // Only this step is skipped — the reminder-voiding step below still runs.
      warnStaffWithheld(payload, 'cancelled', appointment.id, config.staffRecipientNote)
      return
    }
    const serviceName = await fetchServiceName(payload, appointment.serviceId, config.defaultLocale)
    const staff = renderStaffAppointment({
      event: 'cancelled',
      patientName,
      company: appointment.customer.company ?? undefined,
      serviceName,
      scheduledAt: appointment.scheduledAt,
      appointmentId: appointment.id,
      adminBaseUrl: config.adminBaseUrl,
    })
    const staffRow = {
      appointment: appointment.id,
      channel: 'email' as const,
      templateKey: 'staff-appointment-cancelled',
      recipient: staffRecipient,
      subject: staff.subject,
      html: staff.html,
      text: staff.text,
      scheduledFor: new Date().toISOString(),
      dedupeKey: `email:staff-appointment-cancelled:${appointment.id}`,
    }
    const staffResult = await createNotificationIfAbsent(payload, staffRow)
    await sendCreatedRow(payload, dispatcher, staffResult, staffRow)
  })

  await runNotificationStep(payload, `voiding pending reminder for appointment ${appointment.id}`, async () => {
    await payload.update({
      collection: 'notifications',
      where: {
        appointment: { equals: appointment.id },
        templateKey: { equals: 'booking-reminder' },
        status: { equals: 'pending' },
      },
      data: { status: 'skipped', lastError: 'appointment cancelled' },
    })
  })
}
