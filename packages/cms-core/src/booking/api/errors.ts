/**
 * The single documented error taxonomy for the booking API. Every endpoint
 * returns errors in this shape — see toErrorResponse().
 */
export const ERROR_CODES = [
  'SLOT_FULL',
  'SLOT_CLOSED',
  'INVALID_INPUT',
  'NOT_FOUND',
  'UNAUTHORIZED',
  'RATE_LIMITED',
  'CUTOFF_PASSED',
  'PHONE_ALREADY_REGISTERED',
  'INTERNAL',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export class BookingApiError extends Error {
  readonly code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'BookingApiError'
    this.code = code
  }
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
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

export interface ErrorResponseBody {
  error: { code: ErrorCode; message: string }
}

/** The only place a route builds an error response body — keeps the shape uniform. */
export function toErrorResponse(err: BookingApiError): { body: ErrorResponseBody; status: number } {
  return { body: { error: { code: err.code, message: err.message } }, status: STATUS_BY_CODE[err.code] }
}

/**
 * Converts any thrown value into a generic INTERNAL error, never surfacing
 * the original message (which may contain stack traces or SQL detail) to the
 * client. Route handlers should log the original error before calling this.
 */
export function toSafeInternalError(err: unknown): BookingApiError {
  if (err instanceof BookingApiError) return err
  return new BookingApiError('INTERNAL', 'Something went wrong. Please try again.')
}
