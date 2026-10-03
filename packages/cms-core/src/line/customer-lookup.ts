import type { Payload } from 'payload'

/**
 * Shared by Part 1's follow/unfollow handlers (find the customer to flip
 * lineChannelDead) and Part 2's returning-patient shortcut (find the
 * customer to greet by their real registered name before rendering the
 * booking form) — one query, one shape, not duplicated per caller.
 */
export interface LineLinkedCustomer {
  id: string | number
  familyName: string
  givenName: string
  familyNameKana: string
  givenNameKana: string
  phone: string
  email?: string
  lineChannelDead: boolean
}

export async function findCustomerByLineUserId(
  payload: Payload,
  lineUserId: string,
): Promise<LineLinkedCustomer | null> {
  const result = await payload.find({
    collection: 'customers',
    where: { lineUserId: { equals: lineUserId } },
    limit: 1,
  })
  const doc = result.docs[0] as Record<string, unknown> | undefined
  if (!doc) return null

  return {
    id: doc['id'] as string | number,
    familyName: doc['familyName'] as string,
    givenName: doc['givenName'] as string,
    familyNameKana: doc['familyNameKana'] as string,
    givenNameKana: doc['givenNameKana'] as string,
    phone: doc['phone'] as string,
    ...(doc['email'] ? { email: doc['email'] as string } : {}),
    lineChannelDead: Boolean(doc['lineChannelDead']),
  }
}
