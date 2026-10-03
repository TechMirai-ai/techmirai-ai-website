import type { Payload } from 'payload'

import { findCustomerByLineUserId } from '../../line/customer-lookup'
import { deriveAccessToken } from './tokens'
import type { LineManageLookupResponse } from './schemas'

/**
 * Statuses still worth showing/acting on from the "my bookings" list — same
 * set ManageAppointmentView.tsx (ACTIONABLE_STATUSES) already treats as
 * offering cancel/reschedule buttons. A cancelled/completed/no-show
 * appointment is history, not something to surface here.
 */
const ACTIONABLE_STATUSES = ['booked', 'confirmed', 'checked_in']

/** Bounds the list — a returning patient realistically has at most a
 * handful of upcoming bookings; this is a UI picker, not a full history. */
const MAX_APPOINTMENTS = 10

interface RawAppointmentDoc {
  confirmationCode: string
  idempotencyKey: string
  status: string
  visitType: 'first' | 'return'
  scheduledAt: string
  service: { id: number | string } | number | string
}

/**
 * One batched query for every distinct service id across the whole
 * appointment list, instead of one payload.findByID per appointment — a
 * returning patient with several upcoming bookings against the same couple
 * of services should not pay a DB round trip per booking.
 */
async function fetchServiceNames(
  payload: Payload,
  serviceIds: Array<number | string>,
  locale: string,
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(serviceIds.map(String))]
  if (uniqueIds.length === 0) return new Map()

  const result = await payload.find({
    collection: 'bookable-services',
    where: { id: { in: uniqueIds } },
    locale,
    depth: 0,
    limit: uniqueIds.length,
  })

  const names = new Map<string, string>()
  for (const doc of result.docs as unknown as Array<{ id: number | string; name?: string }>) {
    names.set(String(doc.id), doc.name ?? '')
  }
  return names
}

/**
 * STEP 2 Part 4 items 1/3: the caller's own upcoming, actionable bookings —
 * scoped ENTIRELY by the verified LINE identity's matched customer id
 * (`customer.id`, resolved server-side from `verifiedLineUserId`), never by
 * anything the client supplies directly. This is the first of two
 * independent ownership layers: the second is that `access_token` below is
 * freshly re-derived per appointment via `deriveAccessToken` — the SAME
 * permanent credential /cancel and /reschedule already trust — so even if
 * this query were ever wrong, those endpoints independently re-verify
 * ownership against the specific appointment's own stored token hash before
 * doing anything (see schemas.ts's doc comment on lineManageAppointmentSchema).
 *
 * Deliberately does NOT create a customer record for an unmatched caller —
 * same rationale as handleFollowEvent (line/handlers.ts): there is nothing
 * to look up for someone who has never linked their LINE account to a
 * booking, and the caller (LiffManageClient) tells them plainly to book
 * once first rather than falling back to a phone-number search that would
 * reopen the identity-verification problem Part 2 already solved.
 */
export async function handleLineManageLookup(
  payload: Payload,
  verifiedLineUserId: string,
  locale: string,
): Promise<LineManageLookupResponse> {
  const customer = await findCustomerByLineUserId(payload, verifiedLineUserId)
  if (!customer) return { matched: false }

  const nowIso = new Date().toISOString()
  const result = await payload.find({
    collection: 'appointments',
    where: {
      customer: { equals: customer.id },
      status: { in: ACTIONABLE_STATUSES },
      scheduledAt: { greater_than_equal: nowIso },
    },
    sort: 'scheduledAt',
    limit: MAX_APPOINTMENTS,
    depth: 0,
  })

  const docs = result.docs as unknown as RawAppointmentDoc[]
  const serviceIds = docs.map((doc) => (typeof doc.service === 'object' ? doc.service.id : doc.service))
  const serviceNames = await fetchServiceNames(payload, serviceIds, locale)

  const appointments = docs.map((doc) => {
    const serviceId = typeof doc.service === 'object' ? doc.service.id : doc.service
    return {
      confirmation_code: doc.confirmationCode,
      access_token: deriveAccessToken(doc.idempotencyKey),
      status: doc.status,
      visit_type: doc.visitType,
      scheduled_at: doc.scheduledAt,
      service_id: serviceId,
      service_name: serviceNames.get(String(serviceId)) ?? '',
    }
  })

  return { matched: true, appointments }
}
