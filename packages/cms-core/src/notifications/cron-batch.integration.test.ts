import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { createResource, createService, createSlot, createCustomer } from '../booking/test/factories'
import { getTestPayload } from '../booking/test/payload'
import { createBooking } from '../booking/create-booking'
import { attemptSend } from './send'
import { fetchDueNotifications } from './due-notifications'
import type { NotificationDispatcher, OutboundMessage } from './types'

let payload: Payload
let appointmentId: number | string

const PAST = new Date(Date.now() - 60_000).toISOString()
const FUTURE = new Date(Date.now() + 60 * 60_000).toISOString()

beforeAll(async () => {
  payload = await getTestPayload()
  const resource = await createResource(payload)
  const service = await createService(payload)
  const customer = await createCustomer(payload, { email: 'patient@example.com', locale: 'ja' })
  const slot = await createSlot(payload, { resourceId: resource.id, capacity: 1 })

  const { appointment } = await createBooking(payload, {
    slotId: slot.id,
    customerId: customer.id,
    serviceId: service.id,
    visitType: 'first',
    scheduledAt: '2026-08-06T01:30:00.000Z',
    idempotencyKey: `notif-cron-batch-test-${Math.random().toString(36).slice(2)}`,
    source: 'web',
  })
  appointmentId = appointment.id
})

async function createNotification(overrides: Record<string, unknown>) {
  return payload.create({
    collection: 'notifications',
    data: {
      appointment: appointmentId,
      channel: 'email',
      templateKey: 'booking-reminder',
      recipient: 'patient@example.com',
      subject: 'subject',
      html: '<p>html</p>',
      text: 'text',
      status: 'pending',
      scheduledFor: PAST,
      attempts: 0,
      dedupeKey: `email:cron-batch-test:${Math.random().toString(36).slice(2)}`,
      ...overrides,
    },
  })
}

describe('cron batch: fetch + process due notifications', () => {
  it('fetches all due rows in exactly one query and processes them on one connection', async () => {
    const dueA = await createNotification({ scheduledFor: PAST })
    const dueB = await createNotification({ scheduledFor: PAST })
    // attempts starts at 1 (not the default 0) deliberately: notifications
    // .attempts is a Postgres `numeric` column, returned as a STRING by the
    // raw driver read fetchDueNotifications uses. A prior attempts:0 start
    // ("0" + 1 === "01", which still numerically parses to 1 on write)
    // masked exactly this bug — attempts:1 ("1" + 1 === "11" if uncoerced)
    // is what actually caught it in a real dev-server run.
    const dueFailing = await createNotification({ scheduledFor: PAST, attempts: 1 })
    const notDue = await createNotification({ scheduledFor: FUTURE })
    const alreadySent = await createNotification({
      scheduledFor: PAST,
      status: 'sent',
      sentAt: new Date().toISOString(),
      providerMessageId: 'already-sent-1',
    })

    const executeSpy = vi.spyOn(payload.db.drizzle, 'execute')

    const due = await fetchDueNotifications(payload)

    // ONE query regardless of how many rows are due — the hard requirement.
    expect(executeSpy).toHaveBeenCalledTimes(1)

    const dueIds = due.map((row) => row.id)
    expect(dueIds).toEqual(expect.arrayContaining([dueA.id, dueB.id, dueFailing.id]))
    expect(dueIds).not.toContain(notDue.id)
    expect(dueIds).not.toContain(alreadySent.id)

    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async (_channel: unknown, message: OutboundMessage) => {
        if (message.dedupeKey === (dueFailing as { dedupeKey?: string }).dedupeKey) {
          throw new Error('simulated send failure')
        }
        return { providerMessageId: `sent-${message.dedupeKey}` }
      }),
    }

    // Process the whole batch — a failure on one row must not stop the rest.
    for (const notification of due) {
      await attemptSend(payload, dispatcher, notification)
    }

    executeSpy.mockRestore()

    const updatedA = await payload.findByID({ collection: 'notifications', id: dueA.id })
    const updatedB = await payload.findByID({ collection: 'notifications', id: dueB.id })
    const updatedFailing = await payload.findByID({ collection: 'notifications', id: dueFailing.id })
    const updatedNotDue = await payload.findByID({ collection: 'notifications', id: notDue.id })

    expect(updatedA['status']).toBe('sent')
    expect(updatedB['status']).toBe('sent')

    // The failing row's attempts incremented by exactly one (1 -> 2) — a
    // real number, not the string-concatenation "11" the numeric-column bug
    // would have produced — and it was NOT marked permanently failed after
    // only two failures (MAX_SEND_ATTEMPTS is 3). Crucially, the other rows
    // in the batch still completed despite this one failing.
    expect(updatedFailing['status']).toBe('pending')
    expect(updatedFailing['attempts']).toBe(2)

    // A not-yet-due row is untouched by this run.
    expect(updatedNotDue['status']).toBe('pending')
    expect(updatedNotDue['attempts']).toBe(0)
  })
})
