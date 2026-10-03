import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LinePushError, LineReplyError, sendLinePush, sendLineReply } from './client'

describe('sendLineReply', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('POSTs to the reply endpoint with the replyToken, messages, and bearer token', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))

    await sendLineReply('reply-token-abc', [{ type: 'text', text: 'Hello' }], 'access-token-xyz')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.line.me/v2/bot/message/reply')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer access-token-xyz',
    })
    expect(JSON.parse(init?.body as string)).toEqual({
      replyToken: 'reply-token-abc',
      messages: [{ type: 'text', text: 'Hello' }],
    })
  })

  it('throws LineReplyError when LINE responds with a non-2xx status', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid reply token' }), { status: 400 }),
    )

    await expect(
      sendLineReply('expired-token', [{ type: 'text', text: 'Hello' }], 'access-token-xyz'),
    ).rejects.toBeInstanceOf(LineReplyError)
  })

  it('does not swallow a network-level fetch rejection', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockRejectedValue(new Error('network down'))

    await expect(
      sendLineReply('reply-token-abc', [{ type: 'text', text: 'Hello' }], 'access-token-xyz'),
    ).rejects.toThrow('network down')
  })
})

describe('sendLinePush', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('POSTs to the push endpoint with the recipient, messages, and bearer token, and returns the sent message id', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ sentMessages: [{ id: 'line-msg-1' }] }), { status: 200 }),
    )

    const result = await sendLinePush('U123abc', [{ type: 'text', text: 'Hello' }], 'access-token-xyz')

    expect(result).toEqual({ messageId: 'line-msg-1' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.line.me/v2/bot/message/push')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer access-token-xyz',
    })
    expect(JSON.parse(init?.body as string)).toEqual({
      to: 'U123abc',
      messages: [{ type: 'text', text: 'Hello' }],
    })
  })

  it('throws LinePushError when LINE responds with a non-2xx status', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'The user has not added the bot as a friend' }), { status: 400 }))

    await expect(
      sendLinePush('Ublocked', [{ type: 'text', text: 'Hello' }], 'access-token-xyz'),
    ).rejects.toBeInstanceOf(LinePushError)
  })

  it('throws LinePushError when LINE responds 200 with no sentMessages (unexpected shape, fail loud rather than report false success)', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))

    await expect(
      sendLinePush('U123abc', [{ type: 'text', text: 'Hello' }], 'access-token-xyz'),
    ).rejects.toBeInstanceOf(LinePushError)
  })

  it('does not swallow a network-level fetch rejection', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockRejectedValue(new Error('network down'))

    await expect(
      sendLinePush('U123abc', [{ type: 'text', text: 'Hello' }], 'access-token-xyz'),
    ).rejects.toThrow('network down')
  })

  it('sends an X-Line-Retry-Key header when a retryKey is provided, so a lost-response retry cannot double-deliver', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ sentMessages: [{ id: 'line-msg-1' }] }), { status: 200 }),
    )

    await sendLinePush('U123abc', [{ type: 'text', text: 'Hello' }], 'access-token-xyz', 'retry-key-abc')

    const [, init] = fetchMock.mock.calls[0]!
    expect(init?.headers).toMatchObject({ 'X-Line-Retry-Key': 'retry-key-abc' })
  })

  it('omits the X-Line-Retry-Key header when no retryKey is provided', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ sentMessages: [{ id: 'line-msg-1' }] }), { status: 200 }),
    )

    await sendLinePush('U123abc', [{ type: 'text', text: 'Hello' }], 'access-token-xyz')

    const [, init] = fetchMock.mock.calls[0]!
    expect(init?.headers).not.toHaveProperty('X-Line-Retry-Key')
  })
})
