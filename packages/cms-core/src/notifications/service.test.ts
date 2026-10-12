import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isLocalDevelopmentEnv } from './customer-send-policy'
import { notifyBookingCancelled, notifyBookingCreated } from './service'
import type { NotificationDispatcher, NotificationRuntimeConfig } from './service'

beforeEach(() => {
  vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

const config: NotificationRuntimeConfig = {
  staffRecipient: 'staff@clinic-demo.example',
  reminderHourLocal: 9,
  defaultLocale: 'ja',
  adminBaseUrl: 'https://clinic-demo.example',
  meetingToolConfirmed: false,
  isLocalDevelopment: true,
}

function appointmentDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 412,
    confirmationCode: 'ABC123',
    idempotencyKey: 'idem-key-abc',
    scheduledAt: '2026-08-06T01:30:00.000Z',
    visitType: 'first',
    service: { id: 7, name: '一般診察' },
    customer: { id: 3, familyName: '山田', givenName: '太郎', email: 'patient@example.com', locale: 'ja' },
    ...overrides,
  }
}

function fakePayload(
  opts: {
    appointment?: Record<string, unknown> | null
    createShouldDuplicate?: Set<string>
    createShouldFail?: Set<string>
    updateShouldFail?: boolean
  } = {},
) {
  const appointment = opts.appointment === null ? null : appointmentDoc(opts.appointment)
  let nextId = 1000

  const find = vi.fn(async () => ({ docs: appointment ? [appointment] : [] }))
  const findByID = vi.fn(async ({ locale }: { collection: string; id: unknown; locale?: string }) => ({
    name: locale === 'ja' ? '一般診察' : 'General Checkup',
  }))
  const create = vi.fn(async ({ data }: { collection: string; data: Record<string, unknown> }) => {
    const templateKey = data['templateKey'] as string
    if (opts.createShouldDuplicate?.has(templateKey)) {
      throw { code: '23505', message: 'duplicate key value violates unique constraint' }
    }
    if (opts.createShouldFail?.has(templateKey)) {
      throw new Error(`simulated unrelated failure for ${templateKey}`)
    }
    return { id: nextId++ }
  })
  const update = vi.fn(async () => {
    if (opts.updateShouldFail) throw new Error('simulated update failure')
    return {}
  })
  const logger = { warn: vi.fn(), error: vi.fn(), info: vi.fn() }

  return { find, findByID, create, update, logger }
}

function fakeDispatcher(): NotificationDispatcher & { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn(async () => ({ providerMessageId: 'resend-msg-1' })) }
}

function callData(call: unknown[]): Record<string, unknown> {
  return (call[0] as { data: Record<string, unknown> }).data
}

describe('notifyBookingCreated', () => {
  it('creates confirmation, reminder, and staff-created rows for a ja-locale customer with an email', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys.sort()).toEqual(['booking-confirmation', 'booking-reminder', 'staff-appointment-created'].sort())
  })

  it('sends immediately (attemptSend) for confirmation and staff rows, but not the reminder row', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    // attemptSend calls dispatcher.send once per row it processes.
    expect(dispatcher.send).toHaveBeenCalledTimes(2)
  })

  it('renders English copy for an en-locale customer', async () => {
    const payload = fakePayload({ appointment: { customer: { id: 3, familyName: '山田', givenName: '太郎', email: 'patient@example.com', locale: 'en' } } })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    expect(callData(confirmationCall!)['subject']).toMatch(/confirm/i)
  })

  it('skips both customer-facing rows and logs a warning when customer.email is missing and there is no LINE link — staff row still created', async () => {
    const payload = fakePayload({ appointment: { customer: { id: 3, familyName: '山田', givenName: '太郎', locale: 'ja' } } })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).toEqual(['staff-appointment-created'])
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('no usable notification channel'))
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('412'))
  })

  it('routes confirmation and reminder via LINE when the customer has an active LINE link, even though they also have an email on file', async () => {
    const payload = fakePayload({
      appointment: {
        customer: { id: 3, familyName: '山田', givenName: '太郎', email: 'patient@example.com', locale: 'ja', lineUserId: 'Uabc123', lineChannelDead: false },
      },
    })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    expect(callData(confirmationCall!)).toMatchObject({
      channel: 'line',
      recipient: 'Uabc123',
      dedupeKey: 'booking-confirmation:412',
    })
    const reminderCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-reminder')
    expect(callData(reminderCall!)).toMatchObject({
      channel: 'line',
      recipient: 'Uabc123',
      dedupeKey: 'booking-reminder:412',
    })
  })

  it('routes confirmation via LINE for a linked customer with no email on file at all', async () => {
    const payload = fakePayload({
      appointment: {
        customer: { id: 3, familyName: '山田', givenName: '太郎', locale: 'ja', lineUserId: 'Uabc123', lineChannelDead: false },
      },
    })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    expect(callData(confirmationCall!)).toMatchObject({ channel: 'line', recipient: 'Uabc123' })
  })

  it('falls back to email when the customer has blocked the LINE OA (lineChannelDead) even though a lineUserId is still on file', async () => {
    const payload = fakePayload({
      appointment: {
        customer: { id: 3, familyName: '山田', givenName: '太郎', email: 'patient@example.com', locale: 'ja', lineUserId: 'Uabc123', lineChannelDead: true },
      },
    })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    expect(callData(confirmationCall!)).toMatchObject({
      channel: 'email',
      recipient: 'patient@example.com',
      dedupeKey: 'booking-confirmation:412',
    })
  })

  it('skips customer-facing rows when the LINE link is dead and there is no email either', async () => {
    const payload = fakePayload({
      appointment: {
        customer: { id: 3, familyName: '山田', givenName: '太郎', locale: 'ja', lineUserId: 'Uabc123', lineChannelDead: true },
      },
    })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).toEqual(['staff-appointment-created'])
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('no usable notification channel'))
  })

  it('does not send twice when a dedupeKey unique-constraint collision occurs (duplicate prevention)', async () => {
    const payload = fakePayload({ createShouldDuplicate: new Set(['booking-confirmation']) })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    // Only the staff row (not the duplicate-colliding confirmation) gets sent.
    expect(dispatcher.send).toHaveBeenCalledTimes(1)
  })

  it('does nothing (and does not throw) when the appointment cannot be found', async () => {
    const payload = fakePayload({ appointment: null })
    const dispatcher = fakeDispatcher()

    await expect(
      notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'DOES-NOT-EXIST' }),
    ).resolves.not.toThrow()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('an unrelated failure queueing the confirmation does not prevent the reminder or the staff notification from being queued', async () => {
    const payload = fakePayload({ createShouldFail: new Set(['booking-confirmation']) })
    const dispatcher = fakeDispatcher()

    await expect(
      notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' }),
    ).resolves.not.toThrow()

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).toEqual(expect.arrayContaining(['booking-reminder', 'staff-appointment-created']))
    expect(payload.logger.error).toHaveBeenCalledWith(expect.stringContaining('confirmation for appointment 412 failed'))
  })

  it('an unrelated failure queueing the staff notification does not prevent the confirmation from having been queued', async () => {
    const payload = fakePayload({ createShouldFail: new Set(['staff-appointment-created']) })
    const dispatcher = fakeDispatcher()

    await expect(
      notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' }),
    ).resolves.not.toThrow()

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).toEqual(expect.arrayContaining(['booking-confirmation', 'booking-reminder']))
    expect(payload.logger.error).toHaveBeenCalledWith(expect.stringContaining('staff notification for appointment 412 failed'))
  })

  it('includes a manage-appointment link in the confirmation email, derived from the appointment idempotencyKey', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    const html = callData(confirmationCall!)['html'] as string
    expect(html).toContain(`${config.adminBaseUrl}/ja/booking/manage?code=ABC123`)
  })

  it('renders reschedule-specific copy when isReschedule is passed', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, {
      confirmationCode: 'ABC123',
      isReschedule: true,
    })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    expect(callData(confirmationCall!)['subject']).toBe('ご予約変更のお知らせ')
  })
})

describe('notifyBookingCreated — customer emails are fail-closed outside local development', () => {
  // Anything that is not explicitly local development (production, staging, test, unset NODE_ENV).
  const productionConfig: NotificationRuntimeConfig = { ...config, isLocalDevelopment: false }

  it('withholds the customer confirmation: records an auditable skipped row with the reason, stores no content, sends nothing to the customer', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, productionConfig, { confirmationCode: 'ABC123' })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    expect(callData(confirmationCall!)).toMatchObject({
      status: 'skipped',
      dedupeKey: 'booking-confirmation:412',
      lastError: expect.stringContaining('only in local development'),
    })
    expect(callData(confirmationCall!)['html']).toBeUndefined()
    expect(callData(confirmationCall!)['text']).toBeUndefined()
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('confirmation withheld'))
    // Only the staff notification is dispatched.
    expect(dispatcher.send).toHaveBeenCalledTimes(1)
  })

  it('does NOT queue the reminder as pending — it is recorded as skipped with no content — and tells staff the customer confirmation was not sent', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, productionConfig, { confirmationCode: 'ABC123' })

    const reminderCalls = payload.create.mock.calls.filter((call) => callData(call)['templateKey'] === 'booking-reminder')
    expect(reminderCalls).toHaveLength(1)
    expect(callData(reminderCalls[0]!)).toMatchObject({
      status: 'skipped',
      dedupeKey: 'booking-reminder:412',
      lastError: expect.stringContaining('only in local development'),
    })
    expect(callData(reminderCalls[0]!)['html']).toBeUndefined()
    expect(callData(reminderCalls[0]!)['text']).toBeUndefined()
    const staffCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'staff-appointment-created')
    expect(callData(staffCall!)['text']).toContain('Customer confirmation email was NOT sent')
  })

  it('a confirmed meeting tool does not re-open the gate: confirmation, reminder and the customer dispatch stay withheld', async () => {
    const payload = fakePayload({ appointment: { customer: { id: 3, familyName: '山田', givenName: '太郎', email: 'patient@example.com', locale: 'en' } } })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, { ...productionConfig, meetingToolConfirmed: true }, { confirmationCode: 'ABC123' })

    for (const templateKey of ['booking-confirmation', 'booking-reminder']) {
      const call = payload.create.mock.calls.find((c) => callData(c)['templateKey'] === templateKey)
      expect(callData(call!)['status']).toBe('skipped')
    }
    // Only the staff notification is dispatched.
    expect(dispatcher.send).toHaveBeenCalledTimes(1)
    expect(dispatcher.send).toHaveBeenCalledWith('email', expect.objectContaining({ to: 'staff@clinic-demo.example' }))
  })

  it('in local development still sends the confirmation, carrying the literal placeholder so it can be reviewed', async () => {
    const payload = fakePayload({ appointment: { customer: { id: 3, familyName: '山田', givenName: '太郎', email: 'patient@example.com', locale: 'en' } } })
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const confirmationCall = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === 'booking-confirmation')
    expect(callData(confirmationCall!)['text']).toContain('[Meeting tool — CONFIRM: Google Meet, Zoom or Teams]')
    expect(dispatcher.send).toHaveBeenCalledTimes(2)
  })
})

describe('customer booking emails across NODE_ENV values (fail closed)', () => {
  // Build the config exactly the way the app does: from the NODE_ENV string.
  const configFor = (nodeEnv: string | undefined): NotificationRuntimeConfig => ({
    ...config,
    isLocalDevelopment: isLocalDevelopmentEnv(nodeEnv),
  })
  const blockedEnvs: Array<string | undefined> = ['production', 'staging', 'test', undefined, '', 'Development', 'DEVELOPMENT']

  it.each(blockedEnvs)(
    'NODE_ENV=%j: confirmation, reminder and cancellation are each recorded as skipped and never reach the customer; only staff emails are dispatched',
    async (nodeEnv) => {
      const payload = fakePayload()
      const dispatcher = fakeDispatcher()

      await notifyBookingCreated(payload as never, dispatcher, configFor(nodeEnv), { confirmationCode: 'ABC123' })
      await notifyBookingCancelled(payload as never, dispatcher, configFor(nodeEnv), { confirmationCode: 'ABC123' })

      for (const templateKey of ['booking-confirmation', 'booking-reminder', 'booking-cancellation']) {
        const rows = payload.create.mock.calls.filter((call) => callData(call)['templateKey'] === templateKey)
        expect(rows, templateKey).toHaveLength(1)
        expect(callData(rows[0]!), templateKey).toMatchObject({ status: 'skipped' })
        expect(callData(rows[0]!)['text'], templateKey).toBeUndefined()
      }
      const recipients = dispatcher.send.mock.calls.map((call) => (call[1] as { to: string }).to)
      expect(recipients).toEqual(['staff@clinic-demo.example', 'staff@clinic-demo.example'])
    },
  )

  it('NODE_ENV="development": confirmation and cancellation are sent, the reminder is queued pending — unchanged behaviour', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, configFor('development'), { confirmationCode: 'ABC123' })
    await notifyBookingCancelled(payload as never, dispatcher, configFor('development'), { confirmationCode: 'ABC123' })

    for (const templateKey of ['booking-confirmation', 'booking-reminder', 'booking-cancellation']) {
      const row = payload.create.mock.calls.find((call) => callData(call)['templateKey'] === templateKey)
      expect(callData(row!), templateKey).toMatchObject({ status: 'pending' })
    }
    // confirmation + staff-created, then customer cancellation + staff-cancelled. The reminder is sent by the cron, never here.
    expect(dispatcher.send).toHaveBeenCalledTimes(4)
  })
})

describe('staff notifications withheld (staffRecipient: null — development without a valid override)', () => {
  const withheldConfig: NotificationRuntimeConfig = {
    ...config,
    staffRecipient: null,
    staffRecipientNote: 'DEV_STAFF_NOTIFICATION_RECIPIENT is not set, so staff notifications are withheld in development',
  }

  it('creates and sends no staff row on a new booking, logs why, and still handles the customer confirmation and reminder', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, withheldConfig, { confirmationCode: 'ABC123' })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).not.toContain('staff-appointment-created')
    expect(templateKeys).toEqual(expect.arrayContaining(['booking-confirmation', 'booking-reminder']))
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('staff created notification withheld'))
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('not set'))
  })

  it('creates no staff row on a cancellation, but still sends the customer cancellation and voids the pending reminder', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, withheldConfig, { confirmationCode: 'ABC123' })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).toEqual(['booking-cancellation'])
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('staff cancelled notification withheld'))
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'skipped' }) }),
    )
  })

  it('never routes a staff email to any address when withheld: no staff-templateKey row is ever created', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCreated(payload as never, dispatcher, withheldConfig, { confirmationCode: 'ABC123' })
    await notifyBookingCancelled(payload as never, dispatcher, withheldConfig, { confirmationCode: 'ABC123' })

    const staffRows = payload.create.mock.calls.filter((call) => String(callData(call)['templateKey']).startsWith('staff-'))
    expect(staffRows).toHaveLength(0)
  })
})

describe('notifyBookingCancelled', () => {
  it('creates a staff-cancelled row AND a customer-facing cancellation row, and sends both immediately', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys.sort()).toEqual(['booking-cancellation', 'staff-appointment-cancelled'].sort())
    expect(dispatcher.send).toHaveBeenCalledTimes(2)
  })

  it('routes the customer cancellation notification via email for a non-LINE-linked customer, with the reverted unprefixed dedupeKey', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const call = payload.create.mock.calls.find((c) => callData(c)['templateKey'] === 'booking-cancellation')
    expect(callData(call!)).toMatchObject({
      channel: 'email',
      recipient: 'patient@example.com',
      dedupeKey: 'booking-cancellation:412',
    })
  })

  it('routes the customer cancellation notification via LINE for an actively-linked customer', async () => {
    const payload = fakePayload({
      appointment: {
        customer: { id: 3, familyName: '山田', givenName: '太郎', email: 'patient@example.com', locale: 'ja', lineUserId: 'Uabc123', lineChannelDead: false },
      },
    })
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const call = payload.create.mock.calls.find((c) => callData(c)['templateKey'] === 'booking-cancellation')
    expect(callData(call!)).toMatchObject({ channel: 'line', recipient: 'Uabc123' })
  })

  it('skips the customer cancellation notification (staff row still created) when there is no usable channel', async () => {
    const payload = fakePayload({ appointment: { customer: { id: 3, familyName: '山田', givenName: '太郎', locale: 'ja' } } })
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).toEqual(['staff-appointment-cancelled'])
    expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('no usable notification channel'))
  })

  it('does NOT create a customer cancellation row when isReschedule is true — the customer already got the "rescheduled" confirmation for this action', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123', isReschedule: true })

    const templateKeys = payload.create.mock.calls.map((call) => callData(call)['templateKey'] as string)
    expect(templateKeys).toEqual(['staff-appointment-cancelled'])
    expect(dispatcher.send).toHaveBeenCalledTimes(1)
  })

  it('flips any still-pending reminder for the appointment to status: skipped', async () => {
    const payload = fakePayload()
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'notifications',
        where: expect.objectContaining({
          appointment: { equals: 412 },
          templateKey: { equals: 'booking-reminder' },
          status: { equals: 'pending' },
        }),
        data: expect.objectContaining({ status: 'skipped' }),
      }),
    )
  })

  it('does not duplicate the staff-cancelled row when the dedupeKey unique constraint is hit — the independent customer row still sends', async () => {
    const payload = fakePayload({ createShouldDuplicate: new Set(['staff-appointment-cancelled']) })
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    expect(dispatcher.send).toHaveBeenCalledTimes(1)
    expect(dispatcher.send).toHaveBeenCalledWith('email', expect.anything())
  })

  it('does not duplicate the customer cancellation row when its dedupeKey unique constraint is hit — the independent staff row still sends', async () => {
    const payload = fakePayload({ createShouldDuplicate: new Set(['booking-cancellation']) })
    const dispatcher = fakeDispatcher()

    await notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' })

    // The duplicate-colliding row is still ATTEMPTED (createNotificationIfAbsent
    // catches the unique-constraint error and reports created:false) but never
    // sent — only the independent staff row's send goes through.
    expect(dispatcher.send).toHaveBeenCalledTimes(1)
    expect(dispatcher.send).toHaveBeenCalledWith('email', expect.anything())
  })

  it('an unrelated failure creating the staff-cancelled row does not prevent the pending reminder from being voided', async () => {
    const payload = fakePayload({ createShouldFail: new Set(['staff-appointment-cancelled']) })
    const dispatcher = fakeDispatcher()

    await expect(
      notifyBookingCancelled(payload as never, dispatcher, config, { confirmationCode: 'ABC123' }),
    ).resolves.not.toThrow()

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'skipped' }) }),
    )
    expect(payload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('staff cancellation notification for appointment 412 failed'),
    )
  })
})
