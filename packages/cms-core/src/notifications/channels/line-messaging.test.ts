import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSendLinePush } = vi.hoisted(() => ({ mockSendLinePush: vi.fn() }))

vi.mock('../../line/client', () => ({
  sendLinePush: mockSendLinePush,
}))

import { LineMessagingChannel } from './line-messaging'

describe('LineMessagingChannel', () => {
  beforeEach(() => {
    mockSendLinePush.mockReset()
  })

  it('has id "line"', () => {
    const channel = new LineMessagingChannel(() => 'access-token-xyz')
    expect(channel.id).toBe('line')
  })

  it('sends the message text as a single push text message to the recipient LINE user id', async () => {
    mockSendLinePush.mockResolvedValueOnce({ messageId: 'line-msg-1' })
    const channel = new LineMessagingChannel(() => 'access-token-xyz')

    const result = await channel.send({ to: 'U123abc', text: 'ご予約が確定しました。' })

    expect(result).toEqual({ providerMessageId: 'line-msg-1' })
    expect(mockSendLinePush).toHaveBeenCalledWith(
      'U123abc',
      [{ type: 'text', text: 'ご予約が確定しました。' }],
      'access-token-xyz',
      undefined,
    )
  })

  it('derives a stable X-Line-Retry-Key-shaped retryKey from dedupeKey, so a retried send of the same notification cannot double-deliver', async () => {
    mockSendLinePush.mockResolvedValue({ messageId: 'line-msg-1' })
    const channel = new LineMessagingChannel(() => 'access-token-xyz')

    await channel.send({ to: 'U123abc', text: 'Hi', dedupeKey: 'booking-confirmation:412' })
    await channel.send({ to: 'U123abc', text: 'Hi', dedupeKey: 'booking-confirmation:412' })
    await channel.send({ to: 'U123abc', text: 'Hi', dedupeKey: 'booking-reminder:412' })

    const [firstRetryKey] = mockSendLinePush.mock.calls[0]!.slice(3)
    const [secondRetryKey] = mockSendLinePush.mock.calls[1]!.slice(3)
    const [thirdRetryKey] = mockSendLinePush.mock.calls[2]!.slice(3)

    expect(firstRetryKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    // Same dedupeKey -> same retryKey (this IS the idempotency guarantee).
    expect(secondRetryKey).toBe(firstRetryKey)
    // Different dedupeKey -> different retryKey.
    expect(thirdRetryKey).not.toBe(firstRetryKey)
  })

  it('reads the access token lazily at send time, not at construction time', async () => {
    mockSendLinePush.mockResolvedValueOnce({ messageId: 'line-msg-1' })
    let currentToken = 'first-token'
    const channel = new LineMessagingChannel(() => currentToken)

    currentToken = 'rotated-token'
    await channel.send({ to: 'U123abc', text: 'Hi' })

    expect(mockSendLinePush).toHaveBeenCalledWith('U123abc', expect.anything(), 'rotated-token', undefined)
  })

  it('throws without calling sendLinePush when the message has no text content', async () => {
    const channel = new LineMessagingChannel(() => 'access-token-xyz')

    await expect(channel.send({ to: 'U123abc', subject: 'Ignored', html: '<p>Ignored</p>' })).rejects.toThrow(
      /no text content/i,
    )
    expect(mockSendLinePush).not.toHaveBeenCalled()
  })

  it('propagates a send failure rather than swallowing it', async () => {
    mockSendLinePush.mockRejectedValueOnce(new Error('LINE push failed (400): bad request'))
    const channel = new LineMessagingChannel(() => 'access-token-xyz')

    await expect(channel.send({ to: 'U123abc', text: 'Hi' })).rejects.toThrow('LINE push failed (400)')
  })
})
