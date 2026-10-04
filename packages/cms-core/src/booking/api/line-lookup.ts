import type { Payload } from 'payload'

import { findCustomerByLineUserId } from '../../line/customer-lookup'
import type { LineCustomerLookupResponse } from './schemas'

/**
 * STEP 2 Part 2 item 6 (returning-patient shortcut): checked once by the
 * LIFF page before it renders the booking form, using the SAME lookup
 * Part 1's follow/unfollow handlers already use
 * (../../line/customer-lookup.ts) — not a second implementation of "find
 * customer by lineUserId".
 *
 * `verifiedLineUserId` MUST already be verified server-side (see
 * apps/techmirai-web's line-lookup route, which calls
 * @techmirai/cms-core/line's verifyLineIdToken before this).
 *
 * Returns the full registered record, including phone — the LIFF page
 * needs it to submit the eventual reserve() call without re-asking for it
 * (item 6's "do not re-ask... phone... fields already on file"). This is
 * the caller's OWN data: verifiedLineUserId already proves it's theirs, so
 * this isn't exposing one patient's PII to another. The confirm screen
 * itself only ever displays the name (see LiffBookingClient.tsx).
 */
export async function handleLineCustomerLookup(
  payload: Payload,
  verifiedLineUserId: string,
): Promise<LineCustomerLookupResponse> {
  const customer = await findCustomerByLineUserId(payload, verifiedLineUserId)
  if (!customer) return { matched: false }

  return {
    matched: true,
    customer: {
      family_name: customer.familyName,
      given_name: customer.givenName,
      family_name_kana: customer.familyNameKana,
      given_name_kana: customer.givenNameKana,
      phone: customer.phone,
      ...(customer.email ? { email: customer.email } : {}),
    },
  }
}
