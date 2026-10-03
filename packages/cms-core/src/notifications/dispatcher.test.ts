import { describe, expect, it, vi } from 'vitest'

import { createDispatcher } from './dispatcher'
import type { NotificationChannel, OutboundMessage } from './types'

function fakeChannel(id: NotificationChannel['id'], providerMessageId = 'msg-1'): NotificationChannel {
  return {
    id,
    send: vi.fn(async (_message: OutboundMessage) => ({ providerMessageId })),
  }
}

describe('createDispatcher', () => {
  it('routes a send() call to the channel registered under that id', async () => {
    const email = fakeChannel('email', 'email-msg-1')
    const dispatcher = createDispatcher([email])

    const result = await dispatcher.send('email', { to: 'patient@example.com', subject: 'Hi', html: '<p>hi</p>' })

    expect(result).toEqual({ providerMessageId: 'email-msg-1' })
    expect(email.send).toHaveBeenCalledTimes(1)
    expect(email.send).toHaveBeenCalledWith({ to: 'patient@example.com', subject: 'Hi', html: '<p>hi</p>' })
  })

  it('routes to the correct channel when multiple channels are registered', async () => {
    const email = fakeChannel('email', 'email-id')
    const line = fakeChannel('line', 'line-id')
    const dispatcher = createDispatcher([email, line])

    const result = await dispatcher.send('line', { to: 'U1234', text: 'hi' })

    expect(result).toEqual({ providerMessageId: 'line-id' })
    expect(line.send).toHaveBeenCalledTimes(1)
    expect(email.send).not.toHaveBeenCalled()
  })

  it('throws a clear error when no channel is registered for the requested id', async () => {
    const dispatcher = createDispatcher([fakeChannel('email')])

    await expect(dispatcher.send('sms', { to: '+15555550100', text: 'hi' })).rejects.toThrow(/sms/i)
  })

  it('adding a new channel implementation requires no dispatcher.ts change', async () => {
    // Structural proof of "adding a provider must not require changing any call
    // site": a hypothetical future SMS channel is just another object shaped
    // like NotificationChannel, registered at construction time.
    const sms: NotificationChannel = {
      id: 'sms',
      send: vi.fn(async () => ({ providerMessageId: 'sms-1' })),
    }
    const dispatcher = createDispatcher([sms])

    const result = await dispatcher.send('sms', { to: '+15555550100', text: 'hi' })

    expect(result).toEqual({ providerMessageId: 'sms-1' })
  })
})
