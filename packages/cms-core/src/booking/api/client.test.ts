import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  cancel,
  createIdempotencyKey,
  fetchAvailability,
  fetchBookableServices,
  lookup,
  lookupLineAppointments,
  reserve,
} from './client'

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchAvailability', () => {
    it('issues a GET with the query serialized to the documented param names', async () => {
      const mockedFetch = vi.mocked(fetch)
      mockedFetch.mockResolvedValue(jsonResponse({ dates: [] }))

      await fetchAvailability({ from: '2027-01-01', to: '2027-01-07', service_id: 1, resource_id: 2 })

      const [url, init] = mockedFetch.mock.calls[0]!
      expect(String(url)).toContain('/api/v1/booking/availability?')
      expect(String(url)).toContain('from=2027-01-01')
      expect(String(url)).toContain('to=2027-01-07')
      expect(String(url)).toContain('service_id=1')
      expect(String(url)).toContain('resource_id=2')
      expect(init?.method ?? 'GET').toBe('GET')
    })

    it('returns ok:true with parsed data on success', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ dates: [{ date: '2027-01-01', slots: [] }] }),
      )
      const result = await fetchAvailability({ from: '2027-01-01', to: '2027-01-07', service_id: 1 })
      expect(result).toEqual({ ok: true, data: { dates: [{ date: '2027-01-01', slots: [] }] } })
    })

    it('returns ok:false with the taxonomy error on a 4xx/5xx response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ error: { code: 'INVALID_INPUT', message: 'bad input' } }, { status: 400 }),
      )
      const result = await fetchAvailability({ from: '2027-01-01', to: '2027-01-07', service_id: 1 })
      expect(result).toEqual({ ok: false, error: { code: 'INVALID_INPUT', message: 'bad input' } })
    })

    it('rejects a caller-constructed request that fails schema validation, rather than silently sending it', async () => {
      // @ts-expect-error deliberately malformed to prove the client validates before sending
      await expect(fetchAvailability({ from: 'not-a-date', to: '2027-01-07' })).rejects.toThrow()
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('reserve', () => {
    const validRequest = {
      service_id: 1,
      resource_id: 2,
      slot_id: 3,
      visit_type: 'first' as const,
      customer: {
        family_name: '山田',
        given_name: '太郎',
        family_name_kana: 'ヤマダ',
        given_name_kana: 'タロウ',
        phone: '090-0000-0000',
      },
      locale: 'ja',
      idempotency_key: createIdempotencyKey(),
    }

    it('POSTs a JSON body matching the documented request shape', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ confirmation_code: 'ABC123', access_token: 'tok', link_token: 'link-tok' }),
      )

      await reserve(validRequest)

      const [url, init] = vi.mocked(fetch).mock.calls[0]!
      expect(String(url)).toBe('/api/v1/booking/reserve')
      expect(init?.method).toBe('POST')
      expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
      expect(JSON.parse(init?.body as string)).toMatchObject({ service_id: 1, slot_id: 3 })
    })

    it('returns ok:true with the confirmation code and access token', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ confirmation_code: 'ABC123', access_token: 'tok', link_token: 'link-tok' }),
      )
      const result = await reserve(validRequest)
      expect(result).toEqual({
        ok: true,
        data: { confirmation_code: 'ABC123', access_token: 'tok', link_token: 'link-tok' },
      })
    })
  })

  describe('cancel', () => {
    it('POSTs confirmation_code and access_token', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ status: 'cancelled', already_cancelled: false }))

      await cancel({ confirmation_code: 'ABC123', access_token: 'tok' })

      const [url, init] = vi.mocked(fetch).mock.calls[0]!
      expect(String(url)).toBe('/api/v1/booking/cancel')
      expect(JSON.parse(init?.body as string)).toEqual({ confirmation_code: 'ABC123', access_token: 'tok' })
    })
  })

  describe('lookup', () => {
    it('issues a GET with code and token as query params', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({
          confirmation_code: 'ABC123',
          status: 'booked',
          visit_type: 'first',
          scheduled_at: '2027-01-01T00:00:00.000Z',
          service_id: 1,
          resource_id: 2,
        }),
      )

      await lookup({ code: 'ABC123', token: 'tok' })

      const [url, init] = vi.mocked(fetch).mock.calls[0]!
      // access_token is a bearer secret — it must never sit in a URL, where
      // it would be captured by server/proxy/CDN access logs, browser
      // history, and any Referer header sent onward from this page. Only the
      // non-secret code goes in the query string; the token goes in a header.
      expect(String(url)).toBe('/api/v1/booking/lookup?code=ABC123')
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok' })
    })
  })

  describe('fetchBookableServices', () => {
    it('issues a GET with the locale serialized to the documented param name', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ services: [] }))

      await fetchBookableServices({ locale: 'en' })

      const [url, init] = vi.mocked(fetch).mock.calls[0]!
      expect(String(url)).toContain('/api/v1/booking/services?')
      expect(String(url)).toContain('locale=en')
      expect(init?.method ?? 'GET').toBe('GET')
    })

    it('returns ok:true with parsed data on success', async () => {
      const services = [
        { id: 1, name: '一般診察', duration_min: 30, price_yen: 3000, first_visit_allowed: true },
      ]
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ services }))

      const result = await fetchBookableServices({ locale: 'ja' })
      expect(result).toEqual({ ok: true, data: { services } })
    })

    it('returns ok:false with the generic client error on a malformed response body', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ services: [{ id: 1 }] }))

      const result = await fetchBookableServices({ locale: 'ja' })
      expect(result.ok).toBe(false)
    })

    it('returns ok:false with the taxonomy error on a 4xx/5xx response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ error: { code: 'RATE_LIMITED', message: 'slow down' } }, { status: 429 }),
      )

      const result = await fetchBookableServices({ locale: 'ja' })
      expect(result).toEqual({ ok: false, error: { code: 'RATE_LIMITED', message: 'slow down' } })
    })

    it('rejects a request missing locale, rather than silently sending it', async () => {
      // @ts-expect-error deliberately malformed to prove the client validates before sending
      await expect(fetchBookableServices({})).rejects.toThrow()
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('lookupLineAppointments', () => {
    it('POSTs line_id_token and locale to /line-manage-lookup', async () => {
      const mockedFetch = vi.mocked(fetch)
      mockedFetch.mockResolvedValue(jsonResponse({ matched: false }))

      await lookupLineAppointments({ line_id_token: 'id-token-abc', locale: 'ja' })

      const [url, init] = mockedFetch.mock.calls[0]!
      expect(String(url)).toBe('/api/v1/booking/line-manage-lookup')
      expect(init?.method).toBe('POST')
      expect(JSON.parse(init?.body as string)).toEqual({ line_id_token: 'id-token-abc', locale: 'ja' })
    })

    it('returns ok:true with the matched appointment list on success', async () => {
      const appointments = [
        {
          confirmation_code: 'ABC123',
          access_token: 'token-abc',
          status: 'booked',
          visit_type: 'first' as const,
          scheduled_at: '2027-01-01T01:00:00.000Z',
          service_id: 1,
          service_name: '一般診察',
        },
      ]
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ matched: true, appointments }))

      const result = await lookupLineAppointments({ line_id_token: 'id-token-abc', locale: 'ja' })

      expect(result).toEqual({ ok: true, data: { matched: true, appointments } })
    })

    it('returns ok:false with the taxonomy error on a 4xx/5xx response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired LINE session' } }, { status: 401 }),
      )

      const result = await lookupLineAppointments({ line_id_token: 'bad-token', locale: 'ja' })

      expect(result).toEqual({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired LINE session' } })
    })

    it('rejects a request missing line_id_token, rather than silently sending it', async () => {
      // @ts-expect-error deliberately malformed to prove the client validates before sending
      await expect(lookupLineAppointments({ locale: 'ja' })).rejects.toThrow()
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('createIdempotencyKey', () => {
    it('generates a random-looking, sufficiently long key each call', () => {
      const a = createIdempotencyKey()
      const b = createIdempotencyKey()
      expect(a).not.toBe(b)
      expect(a.length).toBeGreaterThanOrEqual(16)
    })
  })
})
