import type { Payload } from 'payload'

import type { ListBookableServicesRequest, ListBookableServicesResponse } from './schemas'

/** Cache-Control max-age applied by the route handler — the catalog changes far less often than slot availability. */
export const SERVICES_CACHE_TTL_SECONDS = 300

/** Defensive bound so the catalog listing can't return an unbounded result set. */
const MAX_SERVICES_RETURNED = 200

interface BookableServiceDoc {
  id: number | string
  name: string
  durationMin: number
  priceYen: number | null | undefined
  firstVisitAllowed: boolean
}

/**
 * Active bookable services, for the public service-selection step of the
 * booking flow. Reads via Payload's local API (bypasses the collection's
 * `read: authenticated` REST access control, same as availability.ts/
 * entities.ts already do for `slots`/`resources`) — this is the one
 * intentional public read of an otherwise authenticated-only collection.
 */
export async function handleListBookableServices(
  payload: Payload,
  input: ListBookableServicesRequest,
): Promise<ListBookableServicesResponse> {
  const result = await payload.find({
    collection: 'bookable-services',
    where: { active: { equals: true } },
    sort: 'sortOrder',
    depth: 0,
    limit: MAX_SERVICES_RETURNED,
    // Without this, Payload's local API falls back to the site's default
    // locale regardless of which locale the requester is browsing in.
    locale: input.locale,
  })

  const services = (result.docs as unknown as BookableServiceDoc[]).map((doc) => ({
    id: doc.id,
    name: doc.name,
    duration_min: doc.durationMin,
    price_yen: doc.priceYen ?? null,
    first_visit_allowed: doc.firstVisitAllowed,
  }))

  return { services }
}
