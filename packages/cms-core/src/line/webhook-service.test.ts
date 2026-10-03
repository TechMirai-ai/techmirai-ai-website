import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { processLineWebhookEvents } from './webhook-service'

function fakePayload(): Payload {
  return { logger: { error: vi.fn() } } as unknown as Payload
}

describe('processLineWebhookEvents', () => {
  it('routes a follow event to the follow handler', async () => {
    const payload = fakePayload()
    const sendReply = vi.fn().mockResolvedValue(undefined)
    const events = [
      {
        type: 'follow',
        mode: 'active',
        timestamp: Date.now(),
        replyToken: 'reply-token-abc',
        source: { type: 'user', userId: 'Uabc' },
      },
    ]

    await processLineWebhookEvents(payload, events, { sendReply, greetingText: 'hi' })

    expect(sendReply).toHaveBeenCalledWith('reply-token-abc', [{ type: 'text', text: 'hi' }])
  })

  it('ignores event types outside this part scope (e.g. message) without throwing', async () => {
    const payload = fakePayload()
    const sendReply = vi.fn()
    const events = [{ type: 'message', mode: 'active', timestamp: Date.now(), source: { type: 'user', userId: 'Uabc' } }]

    await expect(
      processLineWebhookEvents(payload, events, { sendReply, greetingText: 'hi' }),
    ).resolves.not.toThrow()
    expect(sendReply).not.toHaveBeenCalled()
  })

  it('ignores a malformed event without throwing and without stopping the rest of the batch', async () => {
    const payload = fakePayload()
    const sendReply = vi.fn().mockResolvedValue(undefined)
    const events: unknown[] = [
      { type: 'follow' }, // missing required fields
      {
        type: 'follow',
        mode: 'active',
        timestamp: Date.now(),
        replyToken: 'reply-token-good',
        source: { type: 'user', userId: 'Ugood' },
      },
    ]

    await processLineWebhookEvents(payload, events, { sendReply, greetingText: 'hi' })

    expect(sendReply).toHaveBeenCalledTimes(1)
    expect(sendReply).toHaveBeenCalledWith('reply-token-good', [{ type: 'text', text: 'hi' }])
  })
})
