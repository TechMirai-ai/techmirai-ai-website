import { z } from 'zod'

import { ERROR_CODES } from './errors'

/**
 * Payload document id: numeric (Postgres serial) or a numeric string (query
 * params always arrive as strings). Restricted to digits, not any non-empty
 * string — every id in this app's collections is a Postgres integer serial,
 * so a non-numeric value (e.g. "abc", "<script>") can never reference a real
 * document. Rejecting it here means the response is INVALID_INPUT (400)
 * instead of a raw Postgres type-cast error surfacing as a generic
 * INTERNAL (500) once it reaches payload.findByID.
 */
export const entityIdSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/, 'must be a positive integer id'),
])

/**
 * True only if dateStr is a real calendar date. Date.parse alone is not
 * enough: it returns NaN for an out-of-range month (e.g. "2027-13-45") but
 * silently normalizes an out-of-range day within a valid month (e.g.
 * "2027-02-30" becomes March 2) instead of rejecting it — so a NaN check
 * would let February 30 through to the database. A round-trip through
 * Date.UTC catches both: any overflow shows up as a mismatch against the
 * original components.
 */
export function isValidCalendarDate(dateStr: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO calendar date (YYYY-MM-DD)')
  .refine(isValidCalendarDate, 'Not a valid calendar date')

// ---------------------------------------------------------------------------
// GET /availability
// ---------------------------------------------------------------------------

export const availabilityRequestSchema = z.object({
  from: dateOnlySchema,
  to: dateOnlySchema,
  service_id: entityIdSchema,
  // service_id does not filter which slots are returned — the WO-1 schema has
  // no service<->resource/slot relationship, only slot->resource. It is
  // validated against the bookable-services collection (INVALID_INPUT if
  // missing/inactive) so a booking flow can't be pointed at a dead service,
  // but resource_id below is the only real availability filter.
  resource_id: entityIdSchema.optional(),
})
export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>

const availabilitySlotSchema = z.object({
  slot_id: entityIdSchema,
  resource_id: entityIdSchema,
  starts_at: z.string(),
  ends_at: z.string(),
  // Total seats for this slot, alongside remaining_capacity — the client
  // needs both to derive a ◎/○/△/× availability tier (fully-booked slots are
  // included in the response now, not filtered out, so remaining_capacity: 0
  // is a real, renderable state rather than an absent one).
  capacity: z.number().int().min(0),
  remaining_capacity: z.number().int().min(0),
})

export const availabilityResponseSchema = z.object({
  dates: z.array(
    z.object({
      date: dateOnlySchema,
      slots: z.array(availabilitySlotSchema),
    }),
  ),
})
export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>

// ---------------------------------------------------------------------------
// POST /reserve
// ---------------------------------------------------------------------------

const nameFieldSchema = z.string().min(1).max(200)

export const customerInputSchema = z.object({
  family_name: nameFieldSchema,
  given_name: nameFieldSchema,
  family_name_kana: nameFieldSchema,
  given_name_kana: nameFieldSchema,
  phone: z.string().min(1).max(30),
  email: z.string().email().max(320).optional(),
})
export type CustomerInput = z.infer<typeof customerInputSchema>

export const reserveRequestSchema = z.object({
  service_id: entityIdSchema,
  resource_id: entityIdSchema,
  slot_id: entityIdSchema,
  visit_type: z.enum(['first', 'return']),
  customer: customerInputSchema,
  locale: z.string().min(2).max(10),
  /**
   * Client-generated idempotency key, echoed back on retries so a dropped
   * response can be safely resubmitted without double-booking.
   *
   * MUST be produced by a cryptographically secure random source
   * (crypto.randomUUID() or equivalent) — see the note in client.ts. The
   * reserve handler derives access_token deterministically from this key
   * (HMAC-SHA256 with a server secret, see tokens.ts) so an idempotent retry
   * returns a token that still authenticates against the appointment created
   * by the original request. That derivation only adds server-side secrecy on
   * top of whatever entropy this key already has: a guessable
   * idempotency_key yields a guessable access_token even though the server
   * secret itself is never exposed. This is a hard requirement for any
   * frontend code that generates the key, not just an implementation detail
   * of this layer.
   */
  idempotency_key: z.string().min(16).max(200),
  // Honeypot. Real users never populate this hidden field — any non-empty
  // value is treated as a bot submission and rejected as INVALID_INPUT.
  _hp: z.string().optional(),
  /**
   * Raw LIFF ID token (liff.getIDToken()), present only for a booking made
   * through the LINE LIFF flow. NEVER trust this value directly — it must
   * be verified server-side against LINE's own endpoint
   * (verifyLineIdToken, packages/cms-core/src/line/id-token.ts) before its
   * `sub` claim is used as a real lineUserId anywhere. See
   * apps/techmirai-web's reserve route, which does that verification before
   * calling handleReserve — this field only carries the token over the
   * wire, it is not itself a trusted identity.
   */
  line_id_token: z.string().optional(),
})
export type ReserveRequest = z.infer<typeof reserveRequestSchema>

export const reserveResponseSchema = z.object({
  confirmation_code: z.string(),
  access_token: z.string(),
  // Second, expiring credential for the customer's "manage your
  // appointment" link (on-screen and emailed) — see tokens.ts's
  // deriveLinkToken. Distinct from access_token, never the same value.
  link_token: z.string(),
})
export type ReserveResponse = z.infer<typeof reserveResponseSchema>

// ---------------------------------------------------------------------------
// POST /cancel
// ---------------------------------------------------------------------------

export const cancelRequestSchema = z.object({
  confirmation_code: z.string().min(1).max(100),
  access_token: z.string().min(1).max(500),
})
export type CancelRequest = z.infer<typeof cancelRequestSchema>

export const cancelResponseSchema = z.object({
  status: z.literal('cancelled'),
  already_cancelled: z.boolean(),
})
export type CancelResponse = z.infer<typeof cancelResponseSchema>

// ---------------------------------------------------------------------------
// POST /reschedule
// ---------------------------------------------------------------------------

export const rescheduleRequestSchema = z.object({
  confirmation_code: z.string().min(1).max(100),
  // The OLD appointment's credential — access_token or linkToken, either
  // works (see entities.ts's verifyAppointmentAccess).
  access_token: z.string().min(1).max(500),
  new_slot_id: entityIdSchema,
  new_resource_id: entityIdSchema,
  // Client-generated ONCE for the new reservation, same CSPRNG discipline as
  // reserveRequestSchema.idempotency_key — never regenerated on retry.
  idempotency_key: z.string().min(16).max(200),
})
export type RescheduleRequest = z.infer<typeof rescheduleRequestSchema>

export const rescheduleResponseSchema = z.object({
  // Credentials for the NEW appointment — the old one's are no longer usable
  // for management once cancelled.
  confirmation_code: z.string(),
  access_token: z.string(),
  link_token: z.string(),
  // false only in the rare case the new slot was reserved successfully but
  // cancelling the old appointment then failed — the customer temporarily
  // holds both rather than neither. See reschedule.ts.
  old_appointment_cancelled: z.boolean(),
})
export type RescheduleResponse = z.infer<typeof rescheduleResponseSchema>

// ---------------------------------------------------------------------------
// GET /lookup
// ---------------------------------------------------------------------------

export const lookupRequestSchema = z.object({
  code: z.string().min(1).max(100),
  token: z.string().min(1).max(500),
})
export type LookupRequest = z.infer<typeof lookupRequestSchema>

export const lookupResponseSchema = z.object({
  confirmation_code: z.string(),
  status: z.string(),
  visit_type: z.enum(['first', 'return']),
  scheduled_at: z.string(),
  service_id: entityIdSchema,
  resource_id: entityIdSchema,
})
export type LookupResponse = z.infer<typeof lookupResponseSchema>

// ---------------------------------------------------------------------------
// POST /line-customer-lookup
// ---------------------------------------------------------------------------
// STEP 2 Part 2 item 6 (returning-patient shortcut): checked once, before the
// LIFF booking form renders, so it needs its own tiny endpoint rather than
// piggybacking on /reserve. Same trust-boundary rule as reserveRequestSchema:
// the raw token travels over the wire, never a self-asserted lineUserId.

export const lineCustomerLookupRequestSchema = z.object({
  line_id_token: z.string().min(1),
})
export type LineCustomerLookupRequest = z.infer<typeof lineCustomerLookupRequestSchema>

// The full registered record (name + phone/email) crosses back here — this
// is the caller's OWN data, already proven to be theirs via a
// server-verified LINE identity (never another patient's), and the LIFF
// page needs phone specifically to submit the eventual reserve() call
// without re-asking for it (item 6). Shown to the patient only as
// "Continue as [name]?"; phone/email are never rendered on that screen.
export const lineCustomerLookupResponseSchema = z.union([
  z.object({
    matched: z.literal(true),
    customer: customerInputSchema,
  }),
  z.object({ matched: z.literal(false) }),
])
export type LineCustomerLookupResponse = z.infer<typeof lineCustomerLookupResponseSchema>

// ---------------------------------------------------------------------------
// POST /line-manage-lookup
// ---------------------------------------------------------------------------
// STEP 2 Part 4 item 1/3: the LIFF manage page's own identity-scoped lookup —
// same trust-boundary rule as every other line_id_token-carrying endpoint
// (reserveRequestSchema, lineCustomerLookupRequestSchema): the raw ID token
// travels over the wire, never a self-asserted lineUserId, and is verified
// server-side before anything below ever runs.

export const lineManageLookupRequestSchema = z.object({
  line_id_token: z.string().min(1),
  // Threaded through to resolve each appointment's service_name in the
  // caller's own locale — same BCP-47-ish constraint and rationale as
  // listBookableServicesRequestSchema.locale below: Payload's local API
  // silently falls back to the default locale for any unrecognized value
  // instead of erroring, so garbage must be rejected here first.
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
})
export type LineManageLookupRequest = z.infer<typeof lineManageLookupRequestSchema>

// access_token here is freshly re-derived server-side from the appointment's
// own idempotencyKey (tokens.ts's deriveAccessToken) — the SAME permanent
// credential /cancel and /reschedule already trust, not a new credential
// type. Returning it lets the LIFF page hand each appointment straight to
// the existing, unmodified ManageAppointmentView, which re-verifies it
// itself via verifyAppointmentAccess on every action — this endpoint's own
// customer-scoped query is not the only thing standing between a caller and
// someone else's booking.
export const lineManageAppointmentSchema = z.object({
  confirmation_code: z.string(),
  access_token: z.string(),
  status: z.string(),
  visit_type: z.enum(['first', 'return']),
  scheduled_at: z.string(),
  service_id: entityIdSchema,
  service_name: z.string(),
})
export type LineManageAppointment = z.infer<typeof lineManageAppointmentSchema>

export const lineManageLookupResponseSchema = z.union([
  z.object({ matched: z.literal(true), appointments: z.array(lineManageAppointmentSchema) }),
  z.object({ matched: z.literal(false) }),
])
export type LineManageLookupResponse = z.infer<typeof lineManageLookupResponseSchema>

// ---------------------------------------------------------------------------
// GET /services
// ---------------------------------------------------------------------------

/**
 * `name` on the `bookable-services` collection is a localized field — every
 * other reader of localized content in this app (page.tsx, seed scripts)
 * explicitly threads `locale` through payload.find/findByID, since Payload's
 * local API silently falls back to the site's default locale otherwise
 * (no error, no all-locales object) rather than the requester's locale.
 */
export const listBookableServicesRequestSchema = z.object({
  // BCP-47-ish: 'en', 'ja-JP'. Rejects garbage before it reaches Payload's
  // local API, which otherwise silently falls back to the default locale
  // for any unrecognized value instead of erroring (see comment above).
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
})
export type ListBookableServicesRequest = z.infer<typeof listBookableServicesRequestSchema>

export const bookableServiceSchema = z.object({
  id: entityIdSchema,
  name: z.string(),
  duration_min: z.number().int().min(1),
  price_yen: z.number().int().min(0).nullable(),
  first_visit_allowed: z.boolean(),
})
export type BookableService = z.infer<typeof bookableServiceSchema>

export const listBookableServicesResponseSchema = z.object({
  services: z.array(bookableServiceSchema),
})
export type ListBookableServicesResponse = z.infer<typeof listBookableServicesResponseSchema>

// ---------------------------------------------------------------------------
// Shared error shape
// ---------------------------------------------------------------------------

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
  }),
})
export type ErrorResponse = z.infer<typeof errorResponseSchema>
