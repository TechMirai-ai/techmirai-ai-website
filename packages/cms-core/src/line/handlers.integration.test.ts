import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { createCustomer } from '../booking/test/factories'
import { getTestPayload } from '../booking/test/payload'
import { handleFollowEvent, handleUnfollowEvent } from './handlers'
import type { LineFollowEvent, LineUnfollowEvent } from './types'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

function followEvent(userId: string, overrides: Partial<LineFollowEvent> = {}): LineFollowEvent {
  return {
    type: 'follow',
    mode: 'active',
    timestamp: Date.now(),
    replyToken: 'reply-token-abc',
    source: { type: 'user', userId },
    ...overrides,
  }
}

function unfollowEvent(userId: string, overrides: Partial<LineUnfollowEvent> = {}): LineUnfollowEvent {
  return {
    type: 'unfollow',
    mode: 'active',
    timestamp: Date.now(),
    source: { type: 'user', userId },
    ...overrides,
  }
}

async function findByLineUserId(lineUserId: string) {
  const result = await payload.find({
    collection: 'customers',
    where: { lineUserId: { equals: lineUserId } },
    limit: 1,
  })
  return result.docs[0] as Record<string, unknown> | undefined
}

describe('handleFollowEvent', () => {
  it('sends the configured greeting via the reply token', async () => {
    const sendReply = vi.fn().mockResolvedValue(undefined)
    const event = followEvent('Ufollow0000000000000000000000001')

    await handleFollowEvent(payload, event, { sendReply, greetingText: 'こんにちは / Hello' })

    expect(sendReply).toHaveBeenCalledWith('reply-token-abc', [
      { type: 'text', text: 'こんにちは / Hello' },
    ])
  })

  it('does not create a new customer record for an unmatched follower', async () => {
    const sendReply = vi.fn().mockResolvedValue(undefined)
    const userId = 'Ufollow0000000000000000000000002'

    await handleFollowEvent(payload, followEvent(userId), { sendReply, greetingText: 'hi' })

    expect(await findByLineUserId(userId)).toBeUndefined()
  })

  it('clears lineChannelDead on an already-linked customer who re-follows', async () => {
    const userId = 'Ufollow0000000000000000000000003'
    const customer = await createCustomer(payload, { lineUserId: userId, lineChannelDead: true })
    const sendReply = vi.fn().mockResolvedValue(undefined)

    await handleFollowEvent(payload, followEvent(userId), { sendReply, greetingText: 'hi' })

    const updated = await payload.findByID({ collection: 'customers', id: customer.id })
    expect((updated as Record<string, unknown>)['lineChannelDead']).toBe(false)
  })

  it('still resets lineChannelDead even when the reply send fails', async () => {
    const userId = 'Ufollow0000000000000000000000004'
    const customer = await createCustomer(payload, { lineUserId: userId, lineChannelDead: true })
    const sendReply = vi.fn().mockRejectedValue(new Error('LINE reply failed (400)'))

    await expect(
      handleFollowEvent(payload, followEvent(userId), { sendReply, greetingText: 'hi' }),
    ).resolves.not.toThrow()

    const updated = await payload.findByID({ collection: 'customers', id: customer.id })
    expect((updated as Record<string, unknown>)['lineChannelDead']).toBe(false)
  })
})

describe('handleUnfollowEvent', () => {
  it('sets lineChannelDead on the linked customer', async () => {
    const userId = 'Uunfollow000000000000000000000001'
    const customer = await createCustomer(payload, { lineUserId: userId, lineChannelDead: false })

    await handleUnfollowEvent(payload, unfollowEvent(userId))

    const updated = await payload.findByID({ collection: 'customers', id: customer.id })
    expect((updated as Record<string, unknown>)['lineChannelDead']).toBe(true)
  })

  it('is a no-op when the userId matches no customer (expected pre-Part 2)', async () => {
    await expect(
      handleUnfollowEvent(payload, unfollowEvent('Uunfollow000000000000000000000002')),
    ).resolves.not.toThrow()
  })

  it('is idempotent when the customer is already flagged dead', async () => {
    const userId = 'Uunfollow000000000000000000000003'
    const customer = await createCustomer(payload, { lineUserId: userId, lineChannelDead: true })

    await handleUnfollowEvent(payload, unfollowEvent(userId))

    const updated = await payload.findByID({ collection: 'customers', id: customer.id })
    expect((updated as Record<string, unknown>)['lineChannelDead']).toBe(true)
  })
})
