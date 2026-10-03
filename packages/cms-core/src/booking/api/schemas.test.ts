import { describe, expect, it } from 'vitest'

import {
  availabilityRequestSchema,
  availabilityResponseSchema,
  cancelRequestSchema,
  cancelResponseSchema,
  entityIdSchema,
  errorResponseSchema,
  lookupRequestSchema,
  lookupResponseSchema,
  reserveRequestSchema,
  reserveResponseSchema,
} from './schemas'

const validCustomer = {
  family_name: '山田',
  given_name: '太郎',
  family_name_kana: 'ヤマダ',
  given_name_kana: 'タロウ',
  phone: '090-0000-0000',
}

describe('entityIdSchema', () => {
  it('accepts a positive integer', () => {
    expect(entityIdSchema.safeParse(1).success).toBe(true)
  })

  it('accepts a numeric string (as query params always arrive)', () => {
    expect(entityIdSchema.safeParse('42').success).toBe(true)
  })

  it('rejects a non-numeric string instead of letting it reach the database as a raw id', () => {
    expect(entityIdSchema.safeParse('abc').success).toBe(false)
    expect(entityIdSchema.safeParse('<script>').success).toBe(false)
    expect(entityIdSchema.safeParse('1; DROP TABLE slots;').success).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(entityIdSchema.safeParse('').success).toBe(false)
  })
})

describe('availabilityRequestSchema', () => {
  it('accepts from/to/service_id with optional resource_id', () => {
    const result = availabilityRequestSchema.safeParse({
      from: '2026-08-01',
      to: '2026-08-07',
      service_id: 1,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a non-ISO date', () => {
    const result = availabilityRequestSchema.safeParse({
      from: '08/01/2026',
      to: '2026-08-07',
      service_id: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a month outside 01-12', () => {
    const result = availabilityRequestSchema.safeParse({
      from: '2026-08-01',
      to: '2026-13-07',
      service_id: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a day that does not exist in the given month (e.g. February 30)', () => {
    const result = availabilityRequestSchema.safeParse({
      from: '2027-02-30',
      to: '2027-03-01',
      service_id: 1,
    })
    expect(result.success).toBe(false)
  })

  it('accepts February 29 in a leap year and rejects it in a non-leap year', () => {
    expect(
      availabilityRequestSchema.safeParse({ from: '2028-02-29', to: '2028-03-01', service_id: 1 }).success,
    ).toBe(true)
    expect(
      availabilityRequestSchema.safeParse({ from: '2027-02-29', to: '2027-03-01', service_id: 1 }).success,
    ).toBe(false)
  })

  it('rejects a missing service_id', () => {
    const result = availabilityRequestSchema.safeParse({
      from: '2026-08-01',
      to: '2026-08-07',
    })
    expect(result.success).toBe(false)
  })
})

describe('availabilityResponseSchema', () => {
  it('accepts slots grouped by date', () => {
    const result = availabilityResponseSchema.safeParse({
      dates: [
        {
          date: '2026-08-01',
          slots: [
            {
              slot_id: 1,
              resource_id: 2,
              starts_at: '2026-08-01T01:00:00.000Z',
              ends_at: '2026-08-01T01:30:00.000Z',
              capacity: 1,
              remaining_capacity: 1,
            },
          ],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a fully-booked slot with remaining_capacity 0', () => {
    const result = availabilityResponseSchema.safeParse({
      dates: [
        {
          date: '2026-08-01',
          slots: [
            {
              slot_id: 1,
              resource_id: 2,
              starts_at: '2026-08-01T01:00:00.000Z',
              ends_at: '2026-08-01T01:30:00.000Z',
              capacity: 2,
              remaining_capacity: 0,
            },
          ],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a slot missing capacity', () => {
    const result = availabilityResponseSchema.safeParse({
      dates: [
        {
          date: '2026-08-01',
          slots: [
            {
              slot_id: 1,
              resource_id: 2,
              starts_at: '2026-08-01T01:00:00.000Z',
              ends_at: '2026-08-01T01:30:00.000Z',
              remaining_capacity: 1,
            },
          ],
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})

describe('reserveRequestSchema', () => {
  const base = {
    service_id: 1,
    resource_id: 2,
    slot_id: 3,
    visit_type: 'first' as const,
    customer: validCustomer,
    locale: 'ja',
    idempotency_key: 'a-cryptographically-random-uuid-4',
  }

  it('accepts a well-formed reservation request', () => {
    expect(reserveRequestSchema.safeParse(base).success).toBe(true)
  })

  it('accepts an optional customer email', () => {
    const result = reserveRequestSchema.safeParse({
      ...base,
      customer: { ...validCustomer, email: 'taro@example.com' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid customer email', () => {
    const result = reserveRequestSchema.safeParse({
      ...base,
      customer: { ...validCustomer, email: 'not-an-email' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid visit_type', () => {
    const result = reserveRequestSchema.safeParse({ ...base, visit_type: 'walk-in' })
    expect(result.success).toBe(false)
  })

  it('rejects a short idempotency_key', () => {
    const result = reserveRequestSchema.safeParse({ ...base, idempotency_key: 'too-short' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing customer field', () => {
    const { family_name: _familyName, ...incompleteCustomer } = validCustomer
    const result = reserveRequestSchema.safeParse({ ...base, customer: incompleteCustomer })
    expect(result.success).toBe(false)
  })

  it('rejects an oversized customer name instead of writing an unbounded PII blob to the database', () => {
    const result = reserveRequestSchema.safeParse({
      ...base,
      customer: { ...validCustomer, family_name: 'a'.repeat(10_000) },
    })
    expect(result.success).toBe(false)
  })

  it('rejects an oversized phone number', () => {
    const result = reserveRequestSchema.safeParse({
      ...base,
      customer: { ...validCustomer, phone: '0'.repeat(1000) },
    })
    expect(result.success).toBe(false)
  })

  it('rejects an oversized idempotency_key (which could otherwise exceed a Postgres unique-index row-size limit)', () => {
    const result = reserveRequestSchema.safeParse({ ...base, idempotency_key: 'a'.repeat(10_000) })
    expect(result.success).toBe(false)
  })

  it('accepts an honeypot field as optional', () => {
    expect(reserveRequestSchema.safeParse({ ...base, _hp: '' }).success).toBe(true)
  })
})

describe('reserveResponseSchema', () => {
  it('accepts confirmation_code, access_token, and link_token', () => {
    const result = reserveResponseSchema.safeParse({
      confirmation_code: 'ABC123',
      access_token: 'token-value',
      link_token: 'link-token-value',
    })
    expect(result.success).toBe(true)
  })
})

describe('cancelRequestSchema / cancelResponseSchema', () => {
  it('accepts confirmation_code and access_token', () => {
    const result = cancelRequestSchema.safeParse({
      confirmation_code: 'ABC123',
      access_token: 'token-value',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty confirmation_code', () => {
    const result = cancelRequestSchema.safeParse({ confirmation_code: '', access_token: 'x' })
    expect(result.success).toBe(false)
  })

  it('rejects an oversized confirmation_code or access_token', () => {
    expect(
      cancelRequestSchema.safeParse({ confirmation_code: 'a'.repeat(10_000), access_token: 'x' }).success,
    ).toBe(false)
    expect(
      cancelRequestSchema.safeParse({ confirmation_code: 'ABC123', access_token: 'a'.repeat(10_000) }).success,
    ).toBe(false)
  })

  it('accepts a cancel response', () => {
    const result = cancelResponseSchema.safeParse({ status: 'cancelled', already_cancelled: false })
    expect(result.success).toBe(true)
  })
})

describe('lookupRequestSchema / lookupResponseSchema', () => {
  it('requires both code and token', () => {
    expect(lookupRequestSchema.safeParse({ code: 'ABC123' }).success).toBe(false)
    expect(lookupRequestSchema.safeParse({ token: 'x' }).success).toBe(false)
    expect(lookupRequestSchema.safeParse({ code: 'ABC123', token: 'x' }).success).toBe(true)
  })

  it('accepts a lookup response', () => {
    const result = lookupResponseSchema.safeParse({
      confirmation_code: 'ABC123',
      status: 'booked',
      visit_type: 'first',
      scheduled_at: '2026-08-01T01:00:00.000Z',
      service_id: 1,
      resource_id: 2,
    })
    expect(result.success).toBe(true)
  })
})

describe('errorResponseSchema', () => {
  it('accepts every documented error code', () => {
    const codes = ['SLOT_FULL', 'SLOT_CLOSED', 'INVALID_INPUT', 'NOT_FOUND', 'UNAUTHORIZED', 'RATE_LIMITED', 'INTERNAL']
    for (const code of codes) {
      const result = errorResponseSchema.safeParse({ error: { code, message: 'x' } })
      expect(result.success).toBe(true)
    }
  })

  it('rejects an undocumented error code', () => {
    const result = errorResponseSchema.safeParse({ error: { code: 'TEAPOT', message: 'x' } })
    expect(result.success).toBe(false)
  })
})
