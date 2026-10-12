import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { createResource, createService, createSlot, createCustomer } from '../booking/test/factories'
import { getTestPayload } from '../booking/test/payload'
import { createBooking } from '../booking/create-booking'
import { cancelBooking } from '../booking/cancel-booking'
import { notifyBookingCancelled, notifyBookingCreated } from './service'
import { fetchDueNotifications } from './due-notifications'
import { attemptSend } from './send'
import type { NotificationDispatcher } from './types'
import type { NotificationRuntimeConfig } from './service'

let payload: Payload
let resourceId: number | string
let serviceId: number | string

const config: NotificationRuntimeConfig = {
  staffRecipient: 'staff@clinic-demo.example',
  reminderHourLocal: 9,
  defaultLocale: 'ja',
  adminBaseUrl: 'https://clinic-demo.example',
  meetingToolConfirmed: true,
  isLocalDevelopment: true,
}

interface NotificationDoc {
  templateKey: string
  status: string
  subject: string
  html: string
  text: string
  scheduledFor: string
}

function asNotificationDoc(doc: unknown): NotificationDoc {
  return doc as unknown as NotificationDoc
}

function fakeDispatcher(): NotificationDispatcher & { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn(async () => ({ providerMessageId: 'resend-msg-1' })) }
}

beforeAll(async () => {
  payload = await getTestPayload()
  resourceId = (await createResource(payload)).id
  serviceId = (await createService(payload)).id
})

beforeEach(() => {
  vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

interface BookAppointmentOverrides {
  email: string | undefined
  locale?: string
  scheduledAt?: string
  lineUserId?: string
  lineChannelDead?: boolean
}

async function bookAppointment(overrides: BookAppointmentOverrides) {
  const customer = await createCustomer(payload, {
    email: overrides.email,
    locale: overrides.locale ?? 'ja',
    ...(overrides.lineUserId !== undefined ? { lineUserId: overrides.lineUserId } : {}),
    ...(overrides.lineChannelDead !== undefined ? { lineChannelDead: overrides.lineChannelDead } : {}),
  })
  const scheduledAt = overrides.scheduledAt ?? '2026-08-06T01:30:00.000Z'
  // createSlot's default endsAt is NOT computed relative to a custom
  // startsAt — it must be passed explicitly whenever startsAt is overridden,
  // or the slots_ends_after_starts CHECK constraint can be violated.
  const endsAt = new Date(new Date(scheduledAt).getTime() + 30 * 60_000).toISOString()
  const slot = await createSlot(payload, { resourceId, capacity: 1, startsAt: scheduledAt, endsAt })

  const { appointment } = await createBooking(payload, {
    slotId: slot.id,
    customerId: customer.id,
    serviceId,
    visitType: 'first',
    scheduledAt,
    idempotencyKey: `booking-notif-test-${Math.random().toString(36).slice(2)}`,
    source: 'web',
  })
  return { appointment, customer }
}

describe('notifyBookingCreated (integration)', () => {
  it('creates ja-locale confirmation + reminder + staff rows, and sends confirmation/staff immediately', async () => {
    const { appointment } = await bookAppointment({ email: 'ja-patient@example.com', locale: 'ja' })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload, dispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id } },
    })
    const byTemplate = Object.fromEntries(rows.docs.map((d) => [asNotificationDoc(d).templateKey, asNotificationDoc(d)]))

    expect(Object.keys(byTemplate).sort()).toEqual(
      ['booking-confirmation', 'booking-reminder', 'staff-appointment-created'].sort(),
    )
    expect(byTemplate['booking-confirmation']?.status).toBe('sent')
    expect(byTemplate['staff-appointment-created']?.status).toBe('sent')
    // Reminder is deliberately not sent inline — only queued for the cron.
    expect(byTemplate['booking-reminder']?.status).toBe('pending')
    expect(byTemplate['booking-confirmation']?.html).toContain('一般診察')
  })

  it('renders English copy for an en-locale customer', async () => {
    const { appointment } = await bookAppointment({ email: 'en-patient@example.com', locale: 'en' })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload, dispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: {
        appointment: { equals: appointment.id },
        templateKey: { equals: 'booking-confirmation' },
      },
    })
    expect(asNotificationDoc(rows.docs[0]).subject).toMatch(/confirm/i)
  })

  it('skips customer-facing rows (only the staff row is created) when the customer has no email', async () => {
    const { appointment } = await bookAppointment({ email: undefined, locale: 'ja' })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload, dispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id } },
    })
    const templateKeys = rows.docs.map((d) => asNotificationDoc(d).templateKey)
    expect(templateKeys).toEqual(['staff-appointment-created'])
  })

  it('computes a reminder scheduledFor already <= now for a same-day booking, and does not error', async () => {
    const laterToday = new Date(Date.now() + 2 * 60 * 60_000).toISOString()
    const { appointment } = await bookAppointment({ email: 'same-day@example.com', locale: 'ja', scheduledAt: laterToday })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload, dispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: {
        appointment: { equals: appointment.id },
        templateKey: { equals: 'booking-reminder' },
      },
    })
    const reminder = asNotificationDoc(rows.docs[0])
    expect(new Date(reminder.scheduledFor).getTime()).toBeLessThanOrEqual(Date.now())
    expect(reminder.status).toBe('pending')
    expect(reminder.html.toLowerCase()).not.toContain('tomorrow')
  })

  it('STEP 2 Part 3: routes confirmation + reminder via LINE for a LINE-linked customer, and the cron batch path (fetchDueNotifications + attemptSend) pushes the reminder via the line channel', async () => {
    const { appointment } = await bookAppointment({
      email: 'line-linked@example.com',
      locale: 'ja',
      lineUserId: `U_line_${Math.random().toString(36).slice(2)}`,
      lineChannelDead: false,
    })
    const createDispatcher = fakeDispatcher()

    await notifyBookingCreated(payload, createDispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id } },
    })
    const byTemplate = Object.fromEntries(
      rows.docs.map((d) => [asNotificationDoc(d).templateKey, d as Record<string, unknown>]),
    )
    expect(byTemplate['booking-confirmation']?.['channel']).toBe('line')
    expect(byTemplate['booking-reminder']?.['channel']).toBe('line')
    // The confirmation is sent immediately via the real (fake) dispatcher —
    // this IS the reply-vs-push question from item 3: no webhook event
    // exists at this point in a REST-driven booking, so it's a push, same
    // channel id either way at this layer.
    expect(createDispatcher.send).toHaveBeenCalledWith('line', expect.anything())

    // Force the reminder row due now and re-drive it through the exact
    // mechanism the daily cron uses — proves a LINE-linked customer's
    // reminder is routed to push through the real cron batch path, not just
    // through notifyBookingCreated's own immediate best-effort send.
    const reminderRow = byTemplate['booking-reminder'] as { id: number | string }
    await payload.update({
      collection: 'notifications',
      id: reminderRow.id,
      data: { scheduledFor: new Date(Date.now() - 60_000).toISOString() },
    })
    const cronDispatcher = fakeDispatcher()
    const due = await fetchDueNotifications(payload)
    const dueReminder = due.find((row) => row.id === reminderRow.id)
    expect(dueReminder?.channel).toBe('line')
    await attemptSend(payload, cronDispatcher, dueReminder!)
    expect(cronDispatcher.send).toHaveBeenCalledWith('line', expect.anything())

    const sentReminder = await payload.findByID({ collection: 'notifications', id: reminderRow.id })
    expect(sentReminder['status']).toBe('sent')
  })

  it('STEP 2 Part 3: falls back to email when the LINE-linked customer has blocked the OA (lineChannelDead)', async () => {
    const { appointment } = await bookAppointment({
      email: 'blocked-on-line@example.com',
      locale: 'ja',
      lineUserId: `U_line_${Math.random().toString(36).slice(2)}`,
      lineChannelDead: true,
    })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload, dispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id }, templateKey: { equals: 'booking-confirmation' } },
    })
    const confirmation = rows.docs[0] as Record<string, unknown>
    expect(confirmation['channel']).toBe('email')
    expect(confirmation['recipient']).toBe('blocked-on-line@example.com')
  })
})

describe('notifyBookingCancelled (integration)', () => {
  it('creates a staff-cancelled row and flips the still-pending reminder to skipped', async () => {
    const { appointment } = await bookAppointment({ email: 'cancel-me@example.com', locale: 'ja' })
    const createDispatcher = fakeDispatcher()
    await notifyBookingCreated(payload, createDispatcher, config, { confirmationCode: appointment.confirmationCode })

    await cancelBooking(payload, appointment.id)

    const cancelDispatcher = fakeDispatcher()
    await notifyBookingCancelled(payload, cancelDispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id } },
    })
    const byTemplate = Object.fromEntries(rows.docs.map((d) => [asNotificationDoc(d).templateKey, asNotificationDoc(d)]))

    expect(byTemplate['staff-appointment-cancelled']?.status).toBe('sent')
    expect(byTemplate['booking-reminder']?.status).toBe('skipped')
  })

  it('STEP 2 Part 4 item 4: ALSO creates and sends a customer-facing cancellation notification (the gap Part 3 found), via email for a non-LINE-linked customer, alongside the unchanged staff alert', async () => {
    const { appointment } = await bookAppointment({ email: 'cancel-me-2@example.com', locale: 'ja' })
    await notifyBookingCreated(payload, fakeDispatcher(), config, { confirmationCode: appointment.confirmationCode })
    await cancelBooking(payload, appointment.id)

    const cancelDispatcher = fakeDispatcher()
    await notifyBookingCancelled(payload, cancelDispatcher, config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id } },
    })
    const byTemplate = Object.fromEntries(rows.docs.map((d) => [asNotificationDoc(d).templateKey, d as Record<string, unknown>]))

    expect(byTemplate['booking-cancellation']?.['status']).toBe('sent')
    expect(byTemplate['booking-cancellation']?.['channel']).toBe('email')
    expect(byTemplate['booking-cancellation']?.['recipient']).toBe('cancel-me-2@example.com')
    expect(byTemplate['staff-appointment-cancelled']?.['status']).toBe('sent')
  })

  it('STEP 2 Part 4 item 4: routes the customer cancellation notification via LINE for a LINE-linked customer', async () => {
    const { appointment } = await bookAppointment({
      email: 'cancel-line@example.com',
      locale: 'ja',
      lineUserId: `U_line_cancel_${Math.random().toString(36).slice(2)}`,
      lineChannelDead: false,
    })
    await notifyBookingCreated(payload, fakeDispatcher(), config, { confirmationCode: appointment.confirmationCode })
    await cancelBooking(payload, appointment.id)

    await notifyBookingCancelled(payload, fakeDispatcher(), config, { confirmationCode: appointment.confirmationCode })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id }, templateKey: { equals: 'booking-cancellation' } },
    })
    const row = rows.docs[0] as Record<string, unknown>
    expect(row['channel']).toBe('line')
  })

  it('STEP 2 Part 4 item 4: does NOT send a customer cancellation notification for the reschedule side-effect path (isReschedule: true) — avoids double-notifying', async () => {
    const { appointment } = await bookAppointment({ email: 'reschedule-side-effect@example.com', locale: 'ja' })
    await notifyBookingCreated(payload, fakeDispatcher(), config, { confirmationCode: appointment.confirmationCode })
    await cancelBooking(payload, appointment.id)

    await notifyBookingCancelled(payload, fakeDispatcher(), config, {
      confirmationCode: appointment.confirmationCode,
      isReschedule: true,
    })

    const rows = await payload.find({
      collection: 'notifications',
      where: { appointment: { equals: appointment.id }, templateKey: { equals: 'booking-cancellation' } },
    })
    expect(rows.docs).toEqual([])
  })
})
