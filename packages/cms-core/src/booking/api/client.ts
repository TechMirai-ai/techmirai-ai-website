/**
 * Typed fetch client for /api/v1/booking. This module MUST import only
 * schemas.ts (pure zod, no Node/Payload dependencies) — it is bundled into
 * client components, and pulling in anything from the rest of the booking/
 * module graph (node:crypto, Payload, Drizzle) would break that bundle. See
 * the "./booking/client" vs "./booking/api" package.json export split.
 *
 * The frontend must never hand-write a fetch body for these endpoints — call
 * these functions instead so the request/response shapes stay in sync with
 * the server's zod schemas.
 */
import {
  availabilityRequestSchema,
  availabilityResponseSchema,
  cancelRequestSchema,
  cancelResponseSchema,
  errorResponseSchema,
  lineCustomerLookupRequestSchema,
  lineCustomerLookupResponseSchema,
  lineManageLookupRequestSchema,
  lineManageLookupResponseSchema,
  listBookableServicesRequestSchema,
  listBookableServicesResponseSchema,
  lookupRequestSchema,
  lookupResponseSchema,
  rescheduleRequestSchema,
  rescheduleResponseSchema,
  reserveRequestSchema,
  reserveResponseSchema,
} from './schemas'
import type {
  AvailabilityRequest,
  AvailabilityResponse,
  CancelRequest,
  CancelResponse,
  ErrorResponse,
  LineCustomerLookupRequest,
  LineCustomerLookupResponse,
  LineManageLookupRequest,
  LineManageLookupResponse,
  ListBookableServicesRequest,
  ListBookableServicesResponse,
  LookupRequest,
  LookupResponse,
  RescheduleRequest,
  RescheduleResponse,
  ReserveRequest,
  ReserveResponse,
} from './schemas'
import type { z } from 'zod'

const BASE_PATH = '/api/v1/booking'

export type BookingApiResult<T> = { ok: true; data: T } | { ok: false; error: ErrorResponse['error'] }

const GENERIC_CLIENT_ERROR: ErrorResponse['error'] = {
  code: 'INTERNAL',
  message: 'The server returned an unexpected response',
}

async function toResult<T>(response: Response, schema: z.ZodType<T>): Promise<BookingApiResult<T>> {
  let json: unknown
  try {
    json = await response.json()
  } catch {
    return { ok: false, error: GENERIC_CLIENT_ERROR }
  }

  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(json)
    return { ok: false, error: parsedError.success ? parsedError.data.error : GENERIC_CLIENT_ERROR }
  }

  const parsed = schema.safeParse(json)
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: GENERIC_CLIENT_ERROR }
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  return search.toString()
}

/**
 * Generates a client-side idempotency key from a cryptographically secure
 * random source. Always use this (or another CSPRNG-backed generator) rather
 * than any ad-hoc ID scheme when calling reserve() — the /reserve
 * access_token is derived deterministically from idempotency_key (see
 * schemas.ts and tokens.ts on the server), so a guessable key would make the
 * access_token guessable too, even though the server's HMAC secret is never
 * exposed.
 */
export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}

export async function fetchBookableServices(
  input: ListBookableServicesRequest,
): Promise<BookingApiResult<ListBookableServicesResponse>> {
  const query = listBookableServicesRequestSchema.parse(input)
  const qs = toQueryString({ locale: query.locale })
  const response = await fetch(`${BASE_PATH}/services?${qs}`)
  return toResult(response, listBookableServicesResponseSchema)
}

export async function fetchAvailability(input: AvailabilityRequest): Promise<BookingApiResult<AvailabilityResponse>> {
  const query = availabilityRequestSchema.parse(input)
  const qs = toQueryString({
    from: query.from,
    to: query.to,
    service_id: query.service_id,
    resource_id: query.resource_id,
  })
  const response = await fetch(`${BASE_PATH}/availability?${qs}`)
  return toResult(response, availabilityResponseSchema)
}

/** See createIdempotencyKey()'s doc comment for why idempotency_key must be a CSPRNG value. */
export async function reserve(input: ReserveRequest): Promise<BookingApiResult<ReserveResponse>> {
  const body = reserveRequestSchema.parse(input)
  const response = await fetch(`${BASE_PATH}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return toResult(response, reserveResponseSchema)
}

export async function cancel(input: CancelRequest): Promise<BookingApiResult<CancelResponse>> {
  const body = cancelRequestSchema.parse(input)
  const response = await fetch(`${BASE_PATH}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return toResult(response, cancelResponseSchema)
}

/**
 * new_slot_id/new_resource_id come from CalendarGrid's SelectedSlot (see
 * createIdempotencyKey()'s doc comment — idempotency_key must be generated
 * ONCE by the caller when entering the reschedule step, never regenerated on
 * retry, same discipline the booking flow already uses).
 */
export async function reschedule(input: RescheduleRequest): Promise<BookingApiResult<RescheduleResponse>> {
  const body = rescheduleRequestSchema.parse(input)
  const response = await fetch(`${BASE_PATH}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return toResult(response, rescheduleResponseSchema)
}

/**
 * access_token is a bearer secret — never place it in a URL query string,
 * where it would be captured by default in server/proxy/CDN access logs,
 * browser history, and any Referer header this page sends onward (to
 * analytics, error tracking, an outbound link, etc.). Only the non-secret
 * `code` goes in the query string; `token` goes in the Authorization header.
 */
/**
 * STEP 2 Part 2 item 6: checks once, before the LIFF booking form renders,
 * whether this LINE session already matches an existing customer — see
 * ../line-lookup.ts. `line_id_token` is the raw LIFF ID token; the server
 * verifies it, never the client.
 */
export async function lookupLineCustomer(
  input: LineCustomerLookupRequest,
): Promise<BookingApiResult<LineCustomerLookupResponse>> {
  const body = lineCustomerLookupRequestSchema.parse(input)
  const response = await fetch(`${BASE_PATH}/line-customer-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return toResult(response, lineCustomerLookupResponseSchema)
}

/** STEP 2 Part 4 items 1/3 — the LIFF manage page's own identity-scoped booking list. */
export async function lookupLineAppointments(
  input: LineManageLookupRequest,
): Promise<BookingApiResult<LineManageLookupResponse>> {
  const body = lineManageLookupRequestSchema.parse(input)
  const response = await fetch(`${BASE_PATH}/line-manage-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return toResult(response, lineManageLookupResponseSchema)
}

export async function lookup(input: LookupRequest): Promise<BookingApiResult<LookupResponse>> {
  const query = lookupRequestSchema.parse(input)
  const qs = toQueryString({ code: query.code })
  const response = await fetch(`${BASE_PATH}/lookup?${qs}`, {
    headers: { Authorization: `Bearer ${query.token}` },
  })
  return toResult(response, lookupResponseSchema)
}
