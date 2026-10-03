import { sql } from '@payloadcms/db-postgres/drizzle'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { createCustomer } from '../test/factories'
import { getTestPayload } from '../test/payload'
import { applyCustomerLineFields, down, up } from './customer-line-fields'

interface QueryResult {
  rows: Array<Record<string, unknown>>
}

let payload: Payload

function drizzle(): { execute: (q: unknown) => Promise<QueryResult> } {
  return (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<QueryResult> } })
    .drizzle
}

async function query(text: ReturnType<typeof sql>): Promise<QueryResult> {
  return drizzle().execute(text)
}

async function columnNames(): Promise<string[]> {
  const { rows } = await query(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'customers'`,
  )
  return rows.map((r) => String(r['column_name']))
}

beforeAll(async () => {
  payload = await getTestPayload()
  // The test Payload instance boots with `push: true` (see ../test/payload.ts),
  // which already creates line_user_id/line_channel_dead from the
  // CustomersCollection field config. Re-running the raw migration on top
  // proves it's a true no-op against an already-current schema — the same
  // scenario a fresh client's first boot hits (see the migration's own
  // doc comment).
  await applyCustomerLineFields(drizzle())
})

describe('customer LINE fields migration', () => {
  it('adds line_user_id and line_channel_dead columns to customers', async () => {
    const names = await columnNames()
    expect(names).toContain('line_user_id')
    expect(names).toContain('line_channel_dead')
  })

  it('defaults line_channel_dead to false for a customer created without it', async () => {
    const customer = await createCustomer(payload)
    expect(customer['lineChannelDead']).toBe(false)
  })

  it('leaves line_user_id null when not set', async () => {
    const customer = await createCustomer(payload)
    expect(customer['lineUserId'] ?? null).toBeNull()
  })

  it('enforces uniqueness on line_user_id', async () => {
    await createCustomer(payload, { lineUserId: 'Uduplicate0000000000000000000000' })
    await expect(
      createCustomer(payload, { lineUserId: 'Uduplicate0000000000000000000000' }),
    ).rejects.toThrow()
  })

  it('allows multiple customers with a null line_user_id', async () => {
    await expect(createCustomer(payload)).resolves.toBeDefined()
    await expect(createCustomer(payload)).resolves.toBeDefined()
  })

  it('re-running applyCustomerLineFields is idempotent', async () => {
    await expect(applyCustomerLineFields(drizzle())).resolves.not.toThrow()
  })

  it('down() drops the columns and up() restores them', async () => {
    await down({ db: drizzle() } as unknown as MigrateDownArgs)
    expect(await columnNames()).not.toContain('line_user_id')
    expect(await columnNames()).not.toContain('line_channel_dead')

    await up({ db: drizzle() } as unknown as MigrateUpArgs)
    const names = await columnNames()
    expect(names).toContain('line_user_id')
    expect(names).toContain('line_channel_dead')
  })
})
