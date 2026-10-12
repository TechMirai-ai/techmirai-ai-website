import { describe, expect, it } from 'vitest'

import { resolveStaffRecipient } from './staff-recipient'

const REAL = 'info@techmirai-ai.com'
const TEST_INBOX = 'dev-tester@example.test'

describe('resolveStaffRecipient', () => {
  it('uses the override in development', () => {
    expect(resolveStaffRecipient({ configured: REAL, devOverride: TEST_INBOX, nodeEnv: 'development' })).toEqual({
      recipient: TEST_INBOX,
    })
  })

  it('withholds staff email in development when no override is set — it never falls back to the real inbox', () => {
    for (const devOverride of [undefined, '', '   ']) {
      const result = resolveStaffRecipient({ configured: REAL, devOverride, nodeEnv: 'development' })
      expect(result.recipient).toBeNull()
      expect(result.note).toContain('not set')
    }
  })

  it('withholds staff email in development when the override is not a valid email', () => {
    const result = resolveStaffRecipient({ configured: REAL, devOverride: 'not-an-email', nodeEnv: 'development' })
    expect(result.recipient).toBeNull()
    expect(result.note).toContain('not a valid email')
  })

  it('withholds staff email in development when the override is the real inbox (any casing)', () => {
    const result = resolveStaffRecipient({ configured: REAL, devOverride: 'INFO@techmirai-ai.com', nodeEnv: 'development' })
    expect(result.recipient).toBeNull()
    expect(result.note).toContain('equals the real staff inbox')
  })

  it('withholds staff email in development when the override is a plus-alias of the real inbox — it would land in the same mailbox', () => {
    for (const devOverride of ['info+test@techmirai-ai.com', 'INFO+a+b@Techmirai-AI.com']) {
      const result = resolveStaffRecipient({ configured: REAL, devOverride, nodeEnv: 'development' })
      expect(result.recipient).toBeNull()
      expect(result.note).toContain('alias')
    }
  })

  it('still allows another address on the same domain (it is a different mailbox)', () => {
    expect(
      resolveStaffRecipient({ configured: REAL, devOverride: 'jamal+dev@techmirai-ai.com', nodeEnv: 'development' }),
    ).toEqual({ recipient: 'jamal+dev@techmirai-ai.com' })
  })

  it('rejects an override that smuggles in a second address', () => {
    for (const devOverride of ['a@example.test,info@techmirai-ai.com', 'a@example.test info@techmirai-ai.com', 'a@b@example.test']) {
      expect(resolveStaffRecipient({ configured: REAL, devOverride, nodeEnv: 'development' }).recipient).toBeNull()
    }
  })

  it('ignores the override everywhere outside development and keeps the real inbox', () => {
    for (const nodeEnv of ['production', 'test', undefined, 'staging']) {
      expect(resolveStaffRecipient({ configured: REAL, devOverride: TEST_INBOX, nodeEnv })).toEqual({ recipient: REAL })
    }
  })

  it('never puts an email address in a note', () => {
    const notes = [
      resolveStaffRecipient({ configured: REAL, devOverride: undefined, nodeEnv: 'development' }).note,
      resolveStaffRecipient({ configured: REAL, devOverride: 'bad', nodeEnv: 'development' }).note,
      resolveStaffRecipient({ configured: REAL, devOverride: REAL, nodeEnv: 'development' }).note,
    ]
    for (const note of notes) expect(note).not.toMatch(/@/)
  })
})
