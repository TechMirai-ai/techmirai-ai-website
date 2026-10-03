import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { createResource, createService, createSlot, createCustomer } from '../booking/test/factories'
import { getTestPayload } from '../booking/test/payload'
import { createBooking } from '../booking/create-booking'
import { isDuplicateKeyError } from './dedupe-insert'

let payload: Payload
let appointmentId: number | string

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
    idempotencyKey: `notif-dedupe-test-${Math.random().toString(36).slice(2)}`,
    source: 'web',
  })
  appointmentId = appointment.id
})

describe('notifications collection — dedupeKey UNIQUE constraint', () => {
  it('the database rejects a second insert with the same dedupeKey', async () => {
    const dedupeKey = `email:booking-confirmation:${appointmentId}`
    const rowData = {
      appointment: appointmentId,
      channel: 'email' as const,
      templateKey: 'booking-confirmation',
      locale: 'ja',
      recipient: 'patient@example.com',
      subject: 'subject',
      html: '<p>html</p>',
      text: 'text',
      status: 'pending' as const,
      scheduledFor: new Date().toISOString(),
      dedupeKey,
    }

    const first = await payload.create({ collection: 'notifications', data: rowData })
    expect(first.id).toBeDefined()

    let caughtError: unknown
    try {
      await payload.create({ collection: 'notifications', data: { ...rowData, subject: 'a different subject' } })
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeDefined()
    expect(isDuplicateKeyError(caughtError)).toBe(true)

    const count = await payload.count({
      collection: 'notifications',
      where: { dedupeKey: { equals: dedupeKey } },
    })
    expect(count.totalDocs).toBe(1)
  })

  it('applies the same constraint to a staff-notification dedupeKey — not just customer ones', async () => {
    const dedupeKey = `email:staff-appointment-created:${appointmentId}`
    const rowData = {
      appointment: appointmentId,
      channel: 'email' as const,
      templateKey: 'staff-appointment-created',
      recipient: 'staff@clinic-demo.example',
      subject: 'New booking',
      html: '<p>html</p>',
      text: 'text',
      status: 'pending' as const,
      scheduledFor: new Date().toISOString(),
      dedupeKey,
    }

    await payload.create({ collection: 'notifications', data: rowData })

    let caughtError: unknown
    try {
      await payload.create({ collection: 'notifications', data: rowData })
    } catch (err) {
      caughtError = err
    }

    expect(isDuplicateKeyError(caughtError)).toBe(true)

    const count = await payload.count({
      collection: 'notifications',
      where: { dedupeKey: { equals: dedupeKey } },
    })
    expect(count.totalDocs).toBe(1)
  })
})
