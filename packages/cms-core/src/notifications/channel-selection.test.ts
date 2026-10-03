import { describe, expect, it } from 'vitest'

import { resolveNotificationChannel } from './channel-selection'

describe('resolveNotificationChannel', () => {
  it('selects line (with the lineUserId as recipient) when lineUserId is set and lineChannelDead is false', () => {
    expect(
      resolveNotificationChannel({ lineUserId: 'U123', lineChannelDead: false, email: 'patient@example.com' }),
    ).toEqual({ channel: 'line', recipient: 'U123' })
  })

  it('selects line when lineUserId is set and lineChannelDead is undefined (never blocked)', () => {
    expect(resolveNotificationChannel({ lineUserId: 'U123', email: 'patient@example.com' })).toEqual({
      channel: 'line',
      recipient: 'U123',
    })
  })

  it('selects line even when the customer has no email on file', () => {
    expect(resolveNotificationChannel({ lineUserId: 'U123', lineChannelDead: false })).toEqual({
      channel: 'line',
      recipient: 'U123',
    })
  })

  it('falls back to email (with the email as recipient) when lineUserId is set but lineChannelDead is true (blocked the OA)', () => {
    expect(
      resolveNotificationChannel({ lineUserId: 'U123', lineChannelDead: true, email: 'patient@example.com' }),
    ).toEqual({ channel: 'email', recipient: 'patient@example.com' })
  })

  it('selects email when there is no LINE link at all', () => {
    expect(resolveNotificationChannel({ email: 'patient@example.com' })).toEqual({
      channel: 'email',
      recipient: 'patient@example.com',
    })
  })

  it('returns null when the LINE link is dead and there is no email — no usable channel', () => {
    expect(resolveNotificationChannel({ lineUserId: 'U123', lineChannelDead: true })).toBeNull()
  })

  it('returns null when there is neither a LINE link nor an email', () => {
    expect(resolveNotificationChannel({})).toBeNull()
  })
})
