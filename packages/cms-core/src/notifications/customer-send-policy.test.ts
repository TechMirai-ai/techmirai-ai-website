import { describe, expect, it, vi } from 'vitest'

import {
  CUSTOMER_EMAIL_WITHHELD_REASON,
  customerEmailsAllowed,
  isCustomerFacingTemplateKey,
  isLocalDevelopmentEnv,
  markNotificationsWithheld,
  partitionDueNotifications,
} from './customer-send-policy'

describe('isLocalDevelopmentEnv — only an exact "development" counts', () => {
  it('is true for development', () => {
    expect(isLocalDevelopmentEnv('development')).toBe(true)
  })

  it.each(['production', 'staging', 'test', 'preview', '', ' development', 'development ', 'Development', 'DEVELOPMENT', undefined])(
    'is false for %j',
    (nodeEnv) => {
      expect(isLocalDevelopmentEnv(nodeEnv)).toBe(false)
    },
  )
})

describe('customerEmailsAllowed', () => {
  it('follows isLocalDevelopment and nothing else', () => {
    expect(customerEmailsAllowed({ isLocalDevelopment: true })).toBe(true)
    expect(customerEmailsAllowed({ isLocalDevelopment: false })).toBe(false)
  })

  it('has no other switch: extra flags (even a confirmed meeting tool) cannot open it', () => {
    expect(customerEmailsAllowed({ isLocalDevelopment: false, meetingToolConfirmed: true } as never)).toBe(false)
  })
})

describe('isCustomerFacingTemplateKey', () => {
  it('treats the three customer booking templates as customer-facing', () => {
    for (const key of ['booking-confirmation', 'booking-reminder', 'booking-cancellation']) {
      expect(isCustomerFacingTemplateKey(key)).toBe(true)
    }
  })

  it('treats only staff- templates as non-customer', () => {
    expect(isCustomerFacingTemplateKey('staff-appointment-created')).toBe(false)
    expect(isCustomerFacingTemplateKey('staff-appointment-cancelled')).toBe(false)
  })

  it('fails closed: an unknown or missing template key is treated as customer-facing', () => {
    for (const key of [undefined, null, '', 'something-new', 'Staff-appointment-created']) {
      expect(isCustomerFacingTemplateKey(key)).toBe(true)
    }
  })
})

describe('partitionDueNotifications', () => {
  const due = [
    { id: 1, templateKey: 'booking-reminder' },
    { id: 2, templateKey: 'staff-appointment-created' },
    { id: 3, templateKey: 'booking-confirmation' },
    { id: 4, templateKey: undefined },
    { id: 5, templateKey: 'booking-cancellation' },
  ]

  it('when customer emails are not allowed, sends only staff rows and withholds every other row', () => {
    const { toSend, withheld } = partitionDueNotifications(due, false)

    expect(toSend.map((r) => r.id)).toEqual([2])
    expect(withheld.map((r) => r.id)).toEqual([1, 3, 4, 5])
  })

  it('when customer emails are allowed, sends everything and withholds nothing', () => {
    const { toSend, withheld } = partitionDueNotifications(due, true)

    expect(toSend.map((r) => r.id)).toEqual([1, 2, 3, 4, 5])
    expect(withheld).toEqual([])
  })

  it('does not mutate its input', () => {
    const copy = [...due]
    partitionDueNotifications(due, false)
    expect(due).toEqual(copy)
  })
})

describe('markNotificationsWithheld', () => {
  it('marks each row skipped with the reason and writes nothing else', async () => {
    const update = vi.fn(async () => ({}))
    const payload = { update, logger: { error: vi.fn() } }

    await markNotificationsWithheld(payload as never, [{ id: 7 }, { id: 8 }])

    expect(update).toHaveBeenCalledTimes(2)
    expect(update).toHaveBeenCalledWith({
      collection: 'notifications',
      id: 7,
      data: { status: 'skipped', lastError: CUSTOMER_EMAIL_WITHHELD_REASON },
    })
  })

  it('never throws when a write fails: it logs (without row content) and carries on with the next row', async () => {
    const update = vi.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce({})
    const error = vi.fn()

    await expect(markNotificationsWithheld({ update, logger: { error } } as never, [{ id: 1 }, { id: 2 }])).resolves.toBeUndefined()

    expect(update).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('notification 1'))
  })
})
