import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { createCustomer } from '../booking/test/factories'
import { getTestPayload } from '../booking/test/payload'
import { findCustomerByLineUserId } from './customer-lookup'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('findCustomerByLineUserId', () => {
  it('returns the matching customer with real name fields', async () => {
    const userId = 'Ulookup000000000000000000000001'
    const created = await createCustomer(payload, {
      familyName: '田中',
      givenName: '花子',
      familyNameKana: 'タナカ',
      givenNameKana: 'ハナコ',
      lineUserId: userId,
    })

    const found = await findCustomerByLineUserId(payload, userId)

    expect(found).not.toBeNull()
    expect(found?.id).toBe(created.id)
    expect(found?.familyName).toBe('田中')
    expect(found?.givenName).toBe('花子')
    expect(found?.familyNameKana).toBe('タナカ')
    expect(found?.givenNameKana).toBe('ハナコ')
    expect(found?.lineChannelDead).toBe(false)
  })

  it('returns null when no customer has this lineUserId', async () => {
    const found = await findCustomerByLineUserId(payload, 'Ulookup000000000000000000000099')
    expect(found).toBeNull()
  })

  it('reflects a true lineChannelDead flag', async () => {
    const userId = 'Ulookup000000000000000000000002'
    await createCustomer(payload, { lineUserId: userId, lineChannelDead: true })

    const found = await findCustomerByLineUserId(payload, userId)
    expect(found?.lineChannelDead).toBe(true)
  })
})
