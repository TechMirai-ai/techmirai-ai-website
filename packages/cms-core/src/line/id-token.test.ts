import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { verifyLineIdToken } from './id-token'

describe('verifyLineIdToken', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('POSTs form-urlencoded id_token and client_id to the verify endpoint', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ sub: 'Uabc123', aud: 'client-id-xyz' }), { status: 200 }),
    )

    await verifyLineIdToken('raw-id-token', 'client-id-xyz')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.line.me/oauth2/v2.1/verify')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' })
    const body = new URLSearchParams(init?.body as string)
    expect(body.get('id_token')).toBe('raw-id-token')
    expect(body.get('client_id')).toBe('client-id-xyz')
  })

  it('returns the sub claim when verification succeeds', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ sub: 'Uabc123', aud: 'client-id-xyz' }), { status: 200 }),
    )

    const result = await verifyLineIdToken('raw-id-token', 'client-id-xyz')
    expect(result).toBe('Uabc123')
  })

  it('returns null when LINE rejects the token (e.g. malformed JWT)', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_request', error_description: 'JWS format error' }), {
        status: 400,
      }),
    )

    const result = await verifyLineIdToken('garbage', 'client-id-xyz')
    expect(result).toBeNull()
  })

  it('returns null when the response has no sub claim', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ aud: 'client-id-xyz' }), { status: 200 }))

    const result = await verifyLineIdToken('raw-id-token', 'client-id-xyz')
    expect(result).toBeNull()
  })

  it('returns null (never throws) on a network-level fetch failure', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockRejectedValue(new Error('network down'))

    await expect(verifyLineIdToken('raw-id-token', 'client-id-xyz')).resolves.toBeNull()
  })

  it('returns null (never throws) on a malformed JSON response', async () => {
    const fetchMock = vi.mocked(global.fetch)
    fetchMock.mockResolvedValue(new Response('not json', { status: 200 }))

    await expect(verifyLineIdToken('raw-id-token', 'client-id-xyz')).resolves.toBeNull()
  })

  it('rejects an empty raw token without making a network call', async () => {
    const fetchMock = vi.mocked(global.fetch)
    const result = await verifyLineIdToken('', 'client-id-xyz')
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
