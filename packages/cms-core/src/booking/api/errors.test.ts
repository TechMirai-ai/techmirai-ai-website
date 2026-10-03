import { describe, expect, it } from 'vitest'

import { BookingApiError, ERROR_CODES, toErrorResponse, toSafeInternalError } from './errors'

describe('toErrorResponse', () => {
  const expectedStatus: Record<string, number> = {
    SLOT_FULL: 409,
    SLOT_CLOSED: 409,
    INVALID_INPUT: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    RATE_LIMITED: 429,
    CUTOFF_PASSED: 409,
    PHONE_ALREADY_REGISTERED: 409,
    INTERNAL: 500,
  }

  for (const code of ERROR_CODES) {
    it(`maps ${code} to status ${expectedStatus[code]}`, () => {
      const { body, status } = toErrorResponse(new BookingApiError(code, 'a message'))
      expect(status).toBe(expectedStatus[code])
      expect(body).toEqual({ error: { code, message: 'a message' } })
    })
  }

  it('defaults the message to the error code when none is given', () => {
    const { body } = toErrorResponse(new BookingApiError('NOT_FOUND'))
    expect(body.error.message).toBe('NOT_FOUND')
  })
})

describe('toSafeInternalError', () => {
  it('passes an existing BookingApiError through unchanged', () => {
    const original = new BookingApiError('SLOT_FULL', 'no room')
    expect(toSafeInternalError(original)).toBe(original)
  })

  it('converts an arbitrary thrown value into a generic INTERNAL error', () => {
    const converted = toSafeInternalError(new Error('leaked stack trace or SQL detail'))
    expect(converted.code).toBe('INTERNAL')
    expect(converted.message).not.toContain('leaked stack trace or SQL detail')
  })

  it('handles non-Error thrown values', () => {
    const converted = toSafeInternalError('a raw string throw')
    expect(converted.code).toBe('INTERNAL')
  })
})
