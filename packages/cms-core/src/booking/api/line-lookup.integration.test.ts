import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { createCustomer } from '../test/factories'
import { getTestPayload } from '../test/payload'
import { handleLineCustomerLookup } from './line-lookup'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('handleLineCustomerLookup', () => {
  it('returns matched: true with the real registered name and phone when the lineUserId matches a customer', async () => {
    const lineUserId = 'Ulinelookup00000000000000000001'
    await createCustomer(payload, {
      familyName: '佐藤',
      givenName: '次郎',
      familyNameKana: 'サトウ',
      givenNameKana: 'ジロウ',
      phone: '090-1234-5678',
      lineUserId,
    })

    const result = await handleLineCustomerLookup(payload, lineUserId)

    expect(result).toEqual({
      matched: true,
      customer: {
        family_name: '佐藤',
        given_name: '次郎',
        family_name_kana: 'サトウ',
        given_name_kana: 'ジロウ',
        phone: '090-1234-5678',
      },
    })
  })

  it('returns matched: false when no customer has this lineUserId', async () => {
    const result = await handleLineCustomerLookup(payload, 'Ulinelookup00000000000000000099')
    expect(result).toEqual({ matched: false })
  })

  it('includes email when the matched customer has one on file', async () => {
    const lineUserId = 'Ulinelookup00000000000000000002'
    await createCustomer(payload, { lineUserId, phone: '090-1234-5678', email: 'real@example.com' })

    const result = await handleLineCustomerLookup(payload, lineUserId)

    expect(result.matched).toBe(true)
    expect(result).toMatchObject({ customer: { email: 'real@example.com' } })
  })
})
