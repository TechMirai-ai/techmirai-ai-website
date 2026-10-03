import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFindCustomerByLineUserId } = vi.hoisted(() => ({ mockFindCustomerByLineUserId: vi.fn() }))

vi.mock('../line/customer-lookup', () => ({
  findCustomerByLineUserId: mockFindCustomerByLineUserId,
}))

import { attemptSend, MAX_SEND_ATTEMPTS } from './send'
import type { NotificationDispatcher, NotificationRecord } from './types'

function fakeNotification(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: 1,
    channel: 'email',
    recipient: 'patient@example.com',
    subject: 'Your appointment is confirmed',
    html: '<p>Confirmed</p>',
    text: 'Confirmed',
    dedupeKey: 'email:booking-confirmation:1',
    attempts: 0,
    ...overrides,
  }
}

interface FakeUpdateArgs {
  collection: string
  id: number | string
  data: Record<string, unknown>
}

function fakePayload() {
  return {
    update: vi.fn(async (_args: FakeUpdateArgs) => ({})),
    logger: { warn: vi.fn(), error: vi.fn() },
  }
}

describe('attemptSend', () => {
  let payload: ReturnType<typeof fakePayload>

  beforeEach(() => {
    payload = fakePayload()
    mockFindCustomerByLineUserId.mockReset()
    // Default: no LINE lookup result (used only by non-line-channel tests,
    // which must never call this at all — see the dedicated test for that).
    mockFindCustomerByLineUserId.mockResolvedValue(null)
  })

  it('marks the notification sent with providerMessageId on dispatcher success', async () => {
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => ({ providerMessageId: 'resend-1' })),
    }
    const notification = fakeNotification({ attempts: 0 })

    await attemptSend(payload as never, dispatcher, notification)

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'notifications',
        id: 1,
        data: expect.objectContaining({
          status: 'sent',
          providerMessageId: 'resend-1',
          attempts: 1,
        }),
      }),
    )
  })

  it('stays pending with a bumped scheduledFor and attempts on the first failure', async () => {
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => {
        throw new Error('429 rate limited')
      }),
    }
    const notification = fakeNotification({ attempts: 0 })

    await attemptSend(payload as never, dispatcher, notification)

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        data: expect.objectContaining({
          attempts: 1,
          lastError: expect.stringContaining('429 rate limited'),
          scheduledFor: expect.any(String),
        }),
      }),
    )
    const call = payload.update.mock.calls[0]![0]
    expect(call.data.status).not.toBe('failed')
    expect(payload.logger.warn).toHaveBeenCalledTimes(1)
    expect(payload.logger.error).not.toHaveBeenCalled()
  })

  it('stays pending on the second failure (attempts: 1 -> 2)', async () => {
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => {
        throw new Error('timeout')
      }),
    }
    const notification = fakeNotification({ attempts: 1 })

    await attemptSend(payload as never, dispatcher, notification)

    const call = payload.update.mock.calls[0]![0]
    expect(call.data.attempts).toBe(2)
    expect(call.data.status).not.toBe('failed')
  })

  it('marks the notification permanently failed and logs an error on the 3rd failure', async () => {
    expect(MAX_SEND_ATTEMPTS).toBe(3)
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => {
        throw new Error('still failing')
      }),
    }
    const notification = fakeNotification({ attempts: 2 })

    await attemptSend(payload as never, dispatcher, notification)

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        data: expect.objectContaining({
          status: 'failed',
          attempts: 3,
          lastError: expect.stringContaining('still failing'),
        }),
      }),
    )
    expect(payload.logger.error).toHaveBeenCalledTimes(1)
  })

  it('never throws, even when the dispatcher rejects', async () => {
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => {
        throw new Error('boom')
      }),
    }
    const notification = fakeNotification({ attempts: 2 })

    await expect(attemptSend(payload as never, dispatcher, notification)).resolves.not.toThrow()
  })

  it('never throws when persisting a SUCCESSFUL send fails, and does not misclassify it as a send failure', async () => {
    // A transient DB error right after a successful send must not be
    // recorded as if the send itself failed (that would risk a duplicate
    // send on retry) and must never escape attemptSend — the cron batch
    // loop has no try/catch around its calls.
    payload.update.mockRejectedValueOnce(new Error('db write failed'))
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => ({ providerMessageId: 'resend-1' })),
    }
    const notification = fakeNotification({ attempts: 0 })

    await expect(attemptSend(payload as never, dispatcher, notification)).resolves.not.toThrow()

    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'sent' }) }))
    expect(payload.logger.error).toHaveBeenCalledWith(expect.stringContaining('failed to persist status update'))
  })

  it('never throws when persisting the permanent-failure outcome (3rd attempt) also fails', async () => {
    payload.update.mockRejectedValueOnce(new Error('db write failed'))
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => {
        throw new Error('still failing')
      }),
    }
    const notification = fakeNotification({ attempts: 2 })

    await expect(attemptSend(payload as never, dispatcher, notification)).resolves.not.toThrow()
    expect(payload.logger.error).toHaveBeenCalledWith(expect.stringContaining('failed to persist status update'))
  })

  it('never throws when persisting a retry-path outcome also fails', async () => {
    payload.update.mockRejectedValueOnce(new Error('db write failed'))
    const dispatcher: NotificationDispatcher = {
      send: vi.fn(async () => {
        throw new Error('429 rate limited')
      }),
    }
    const notification = fakeNotification({ attempts: 0 })

    await expect(attemptSend(payload as never, dispatcher, notification)).resolves.not.toThrow()
    expect(payload.logger.error).toHaveBeenCalledWith(expect.stringContaining('failed to persist status update'))
  })

  describe('LINE liveness recheck (a row queued as channel: line can go stale by send time)', () => {
    it('does not look up the customer at all for a non-line channel', async () => {
      const dispatcher: NotificationDispatcher = {
        send: vi.fn(async () => ({ providerMessageId: 'resend-1' })),
      }
      const notification = fakeNotification({ channel: 'email', attempts: 0 })

      await attemptSend(payload as never, dispatcher, notification)

      expect(mockFindCustomerByLineUserId).not.toHaveBeenCalled()
      expect(dispatcher.send).toHaveBeenCalledWith('email', expect.objectContaining({ to: 'patient@example.com' }))
    })

    it('sends via line as queued when the customer is still actively linked', async () => {
      mockFindCustomerByLineUserId.mockResolvedValue({
        id: 3,
        lineChannelDead: false,
        email: 'patient@example.com',
      })
      const dispatcher: NotificationDispatcher = {
        send: vi.fn(async () => ({ providerMessageId: 'line-msg-1' })),
      }
      const notification = fakeNotification({ channel: 'line', recipient: 'Uabc123', attempts: 0 })

      await attemptSend(payload as never, dispatcher, notification)

      expect(dispatcher.send).toHaveBeenCalledWith('line', expect.objectContaining({ to: 'Uabc123' }))
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'sent' }) }),
      )
    })

    it('redirects to email when the customer has since blocked the LINE OA and has an email to fall back to', async () => {
      mockFindCustomerByLineUserId.mockResolvedValue({
        id: 3,
        lineChannelDead: true,
        email: 'fallback@example.com',
      })
      const dispatcher: NotificationDispatcher = {
        send: vi.fn(async () => ({ providerMessageId: 'resend-fallback-1' })),
      }
      const notification = fakeNotification({ channel: 'line', recipient: 'Uabc123', attempts: 0 })

      await attemptSend(payload as never, dispatcher, notification)

      expect(mockFindCustomerByLineUserId).toHaveBeenCalledWith(payload, 'Uabc123')
      expect(dispatcher.send).toHaveBeenCalledWith('email', expect.objectContaining({ to: 'fallback@example.com' }))
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'sent',
            channel: 'email',
            recipient: 'fallback@example.com',
            providerMessageId: 'resend-fallback-1',
          }),
        }),
      )
    })

    it('marks the row skipped without attempting any send when blocked and there is no email to fall back to', async () => {
      mockFindCustomerByLineUserId.mockResolvedValue({ id: 3, lineChannelDead: true })
      const dispatcher: NotificationDispatcher = {
        send: vi.fn(async () => ({ providerMessageId: 'should-not-be-called' })),
      }
      const notification = fakeNotification({ channel: 'line', recipient: 'Uabc123', attempts: 0 })

      await attemptSend(payload as never, dispatcher, notification)

      expect(dispatcher.send).not.toHaveBeenCalled()
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'skipped', lastError: expect.stringContaining('blocked') }),
        }),
      )
    })

    it('fails open (proceeds with the originally queued line channel) when the liveness lookup itself throws', async () => {
      mockFindCustomerByLineUserId.mockRejectedValue(new Error('db unavailable'))
      const dispatcher: NotificationDispatcher = {
        send: vi.fn(async () => ({ providerMessageId: 'line-msg-1' })),
      }
      const notification = fakeNotification({ channel: 'line', recipient: 'Uabc123', attempts: 0 })

      await attemptSend(payload as never, dispatcher, notification)

      expect(dispatcher.send).toHaveBeenCalledWith('line', expect.objectContaining({ to: 'Uabc123' }))
      expect(payload.logger.warn).toHaveBeenCalledWith(expect.stringContaining('liveness recheck failed'))
    })

    it('proceeds with the originally queued line channel when no customer is found for that LINE user id (defensive fallback)', async () => {
      mockFindCustomerByLineUserId.mockResolvedValue(null)
      const dispatcher: NotificationDispatcher = {
        send: vi.fn(async () => ({ providerMessageId: 'line-msg-1' })),
      }
      const notification = fakeNotification({ channel: 'line', recipient: 'Uabc123', attempts: 0 })

      await attemptSend(payload as never, dispatcher, notification)

      expect(dispatcher.send).toHaveBeenCalledWith('line', expect.objectContaining({ to: 'Uabc123' }))
    })
  })
})
