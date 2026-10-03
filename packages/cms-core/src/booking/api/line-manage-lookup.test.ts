import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleLineManageLookup } from './line-manage-lookup'
import { deriveAccessToken } from './tokens'

beforeEach(() => {
  vi.stubEnv('BOOKING_TOKEN_SECRET', 'test-secret-do-not-use-in-production')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

function fakePayload(opts: {
  customer?: Record<string, unknown> | null
  appointments?: Record<string, unknown>[]
  services?: Record<string, unknown>[]
}) {
  const find = vi.fn(async ({ collection }: { collection: string }) => {
    if (collection === 'customers') return { docs: opts.customer ? [opts.customer] : [] }
    if (collection === 'appointments') return { docs: opts.appointments ?? [] }
    if (collection === 'bookable-services') return { docs: opts.services ?? [{ id: 7, name: '一般診察' }] }
    return { docs: [] }
  })
  return { find }
}

describe('handleLineManageLookup', () => {
  it('returns matched: false when no customer has this lineUserId — never queries appointments at all', async () => {
    const payload = fakePayload({ customer: null })

    const result = await handleLineManageLookup(payload as never, 'Uabc123', 'ja')

    expect(result).toEqual({ matched: false })
    expect(payload.find).toHaveBeenCalledTimes(1)
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'customers' }))
  })

  it('returns matched: true with an empty list when the customer has no upcoming appointments, without querying bookable-services at all', async () => {
    const payload = fakePayload({ customer: { id: 3 }, appointments: [] })

    const result = await handleLineManageLookup(payload as never, 'Uabc123', 'ja')

    expect(result).toEqual({ matched: true, appointments: [] })
    expect(payload.find.mock.calls.some((c) => c[0]?.collection === 'bookable-services')).toBe(false)
  })

  it('scopes the appointments query to ONLY this customer id — never a client-suppliable value', async () => {
    const payload = fakePayload({ customer: { id: 3 }, appointments: [] })

    await handleLineManageLookup(payload as never, 'Uabc123', 'ja')

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'appointments',
        where: expect.objectContaining({ customer: { equals: 3 } }),
      }),
    )
  })

  it('returns each appointment with a freshly re-derived access_token matching deriveAccessToken(idempotencyKey)', async () => {
    const payload = fakePayload({
      customer: { id: 3 },
      appointments: [
        {
          confirmationCode: 'ABC123',
          idempotencyKey: 'idem-key-1',
          status: 'booked',
          visitType: 'first',
          scheduledAt: '2026-09-01T01:00:00.000Z',
          service: { id: 7 },
        },
      ],
      services: [{ id: 7, name: '一般診察' }],
    })

    const result = await handleLineManageLookup(payload as never, 'Uabc123', 'ja')

    expect(result).toEqual({
      matched: true,
      appointments: [
        {
          confirmation_code: 'ABC123',
          access_token: deriveAccessToken('idem-key-1'),
          status: 'booked',
          visit_type: 'first',
          scheduled_at: '2026-09-01T01:00:00.000Z',
          service_id: 7,
          service_name: '一般診察',
        },
      ],
    })
  })

  it('resolves service_name via ONE batched query in the requested locale, not one query per appointment', async () => {
    const payload = fakePayload({
      customer: { id: 3 },
      appointments: [
        {
          confirmationCode: 'ABC123',
          idempotencyKey: 'idem-key-1',
          status: 'booked',
          visitType: 'first',
          scheduledAt: '2026-09-01T01:00:00.000Z',
          service: { id: 7 },
        },
        {
          confirmationCode: 'DEF456',
          idempotencyKey: 'idem-key-2',
          status: 'booked',
          visitType: 'return',
          scheduledAt: '2026-09-02T01:00:00.000Z',
          service: { id: 7 },
        },
      ],
      services: [{ id: 7, name: 'General Checkup' }],
    })

    const result = await handleLineManageLookup(payload as never, 'Uabc123', 'en')

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.appointments.every((a) => a.service_name === 'General Checkup')).toBe(true)
    }
    const serviceCalls = payload.find.mock.calls.filter((c) => c[0]?.collection === 'bookable-services')
    expect(serviceCalls).toHaveLength(1)
    expect(serviceCalls[0]?.[0]).toMatchObject({ locale: 'en', where: { id: { in: ['7'] } } })
  })

  it('handles more than one upcoming appointment, preserving order', async () => {
    const payload = fakePayload({
      customer: { id: 3 },
      appointments: [
        {
          confirmationCode: 'AAA111',
          idempotencyKey: 'idem-a',
          status: 'booked',
          visitType: 'first',
          scheduledAt: '2026-09-01T01:00:00.000Z',
          service: { id: 7 },
        },
        {
          confirmationCode: 'BBB222',
          idempotencyKey: 'idem-b',
          status: 'confirmed',
          visitType: 'return',
          scheduledAt: '2026-09-10T01:00:00.000Z',
          service: { id: 8 },
        },
      ],
    })

    const result = await handleLineManageLookup(payload as never, 'Uabc123', 'ja')

    expect(result.matched).toBe(true)
    if (result.matched) {
      expect(result.appointments.map((a) => a.confirmation_code)).toEqual(['AAA111', 'BBB222'])
    }
  })
})
