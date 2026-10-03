import { describe, expect, it, vi } from 'vitest'

import { createNotificationIfAbsent, isDuplicateKeyError } from './dedupe-insert'
import type { CreateNotificationInput } from './dedupe-insert'

function fakePayload(createImpl: () => Promise<unknown>) {
  return { create: vi.fn(createImpl) }
}

/**
 * Matches what Payload's Local API actually throws for a unique-constraint
 * violation (verified against real Postgres in notifications.integration.test.ts,
 * via @payloadcms/drizzle's handleUpsertError) — a `ValidationError` naming
 * the offending field in `data.errors[].path`, not the raw driver error.
 */
function fakeValidationError(field: string) {
  return {
    name: 'ValidationError',
    message: `The following field is invalid: ${field}`,
    data: { errors: [{ message: 'Value must be unique', path: field }] },
  }
}

const customerConfirmationInput: CreateNotificationInput = {
  appointment: 412,
  channel: 'email',
  templateKey: 'booking-confirmation',
  locale: 'ja',
  recipient: 'patient@example.com',
  subject: 'subject',
  html: '<p>html</p>',
  text: 'text',
  scheduledFor: '2026-08-05T00:00:00.000Z',
  dedupeKey: 'email:booking-confirmation:412',
}

const staffCreatedInput: CreateNotificationInput = {
  appointment: 412,
  channel: 'email',
  templateKey: 'staff-appointment-created',
  recipient: 'staff@clinic-demo.example',
  subject: 'New booking',
  html: '<p>html</p>',
  text: 'text',
  scheduledFor: '2026-08-05T00:00:00.000Z',
  dedupeKey: 'email:staff-appointment-created:412',
}

describe('isDuplicateKeyError', () => {
  it('recognizes Payload Local API\'s ValidationError naming dedupeKey as the invalid field', () => {
    expect(isDuplicateKeyError(fakeValidationError('dedupeKey'))).toBe(true)
  })

  it('does not misfire on a ValidationError naming a different unique field', () => {
    expect(isDuplicateKeyError(fakeValidationError('confirmationCode'))).toBe(false)
  })

  it('recognizes a raw Postgres unique-violation error (code 23505) — fallback for a non-Local-API caller', () => {
    expect(isDuplicateKeyError({ code: '23505', message: 'duplicate key value violates unique constraint' })).toBe(
      true,
    )
  })

  it('recognizes a wrapped error via message text', () => {
    expect(isDuplicateKeyError(new Error('duplicate key value violates unique constraint "notifications_dedupeKey_idx"'))).toBe(
      true,
    )
  })

  it('recognizes a nested cause chain', () => {
    const inner = { code: '23505', message: 'duplicate key value violates unique constraint' }
    expect(isDuplicateKeyError({ message: 'ValidationError', cause: inner })).toBe(true)
  })

  it('returns false for an unrelated error', () => {
    expect(isDuplicateKeyError(new Error('connection refused'))).toBe(false)
    expect(isDuplicateKeyError(null)).toBe(false)
    expect(isDuplicateKeyError(undefined)).toBe(false)
  })
})

describe('createNotificationIfAbsent', () => {
  it('creates the row and returns { created: true, id } on first insert', async () => {
    const payload = fakePayload(async () => ({ id: 99 }))

    const result = await createNotificationIfAbsent(payload as never, customerConfirmationInput)

    expect(result).toEqual({ created: true, id: 99 })
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'notifications',
      data: { status: 'pending', ...customerConfirmationInput },
    })
  })

  it('returns { created: false } without throwing when the dedupeKey unique constraint is hit — customer notification', async () => {
    const payload = fakePayload(async () => {
      throw fakeValidationError('dedupeKey')
    })

    await expect(createNotificationIfAbsent(payload as never, customerConfirmationInput)).resolves.toEqual({
      created: false,
    })
  })

  it('returns { created: false } without throwing when the dedupeKey unique constraint is hit — staff notification', async () => {
    // Duplicate prevention must apply identically to staff notifications, not
    // just customer-facing ones — same primitive, same guarantee.
    const payload = fakePayload(async () => {
      throw fakeValidationError('dedupeKey')
    })

    await expect(createNotificationIfAbsent(payload as never, staffCreatedInput)).resolves.toEqual({
      created: false,
    })
  })

  it('rethrows an unrelated error instead of swallowing it', async () => {
    const payload = fakePayload(async () => {
      throw new Error('connection refused')
    })

    await expect(createNotificationIfAbsent(payload as never, customerConfirmationInput)).rejects.toThrow(
      'connection refused',
    )
  })
})
