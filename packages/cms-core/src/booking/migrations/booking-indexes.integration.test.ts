import { sql } from '@payloadcms/db-postgres/drizzle'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { createResource, createSlot } from '../test/factories'
import { getTestPayload } from '../test/payload'
import { applyBookingIndexes, down, up } from './booking-indexes'

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

async function indexNames(): Promise<string[]> {
  const { rows } = await query(sql`SELECT indexname FROM pg_indexes WHERE tablename = 'slots' OR tablename = 'appointments'`)
  return rows.map((r) => String(r['indexname']))
}

beforeAll(async () => {
  payload = await getTestPayload()
  await applyBookingIndexes(drizzle())
})

describe('booking indexes migration', () => {
  it('creates the composite index slots(resource_id, starts_at)', async () => {
    const { rows } = await query(
      sql`SELECT indexdef FROM pg_indexes WHERE indexname = 'slots_resource_starts_at_idx'`,
    )
    expect(rows).toHaveLength(1)
    expect(String(rows[0]!['indexdef'])).toMatch(/resource_id.*starts_at/s)
  })

  it('creates the partial index slots(starts_at) WHERE status = open', async () => {
    const { rows } = await query(
      sql`SELECT indexdef FROM pg_indexes WHERE indexname = 'slots_starts_at_open_idx'`,
    )
    expect(rows).toHaveLength(1)
    expect(String(rows[0]!['indexdef'])).toMatch(/WHERE .*status/is)
  })

  it('creates the availability index slots(resource_id, starts_at) WHERE status = open', async () => {
    const { rows } = await query(
      sql`SELECT indexdef FROM pg_indexes WHERE indexname = 'slots_resource_starts_at_open_idx'`,
    )
    expect(rows).toHaveLength(1)
    expect(String(rows[0]!['indexdef'])).toMatch(/WHERE .*status/is)
  })

  it('indexes the appointments foreign keys slot_id and service_id', async () => {
    const names = await indexNames()
    expect(names).toContain('appointments_slot_id_idx')
    expect(names).toContain('appointments_service_id_idx')
  })

  it('adds the booked_count-within-capacity CHECK constraint', async () => {
    const { rows } = await query(
      sql`SELECT conname FROM pg_constraint WHERE conname = 'slots_booked_count_within_capacity'`,
    )
    expect(rows).toHaveLength(1)
  })

  it('the capacity CHECK rejects booked_count greater than capacity', async () => {
    const resourceId = (await createResource(payload)).id
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    await expect(query(sql`UPDATE slots SET booked_count = 5 WHERE id = ${slot.id}`)).rejects.toThrow()
  })

  it('rejects a slot whose ends_at is not after starts_at', async () => {
    const resourceId = (await createResource(payload)).id
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    await expect(
      query(sql`UPDATE slots SET ends_at = starts_at WHERE id = ${slot.id}`),
    ).rejects.toThrow()
  })

  it('rejects a non-positive capacity', async () => {
    const resourceId = (await createResource(payload)).id
    const slot = await createSlot(payload, { resourceId, capacity: 1 })
    await expect(query(sql`UPDATE slots SET capacity = 0 WHERE id = ${slot.id}`)).rejects.toThrow()
  })

  it('prevents deleting a resource that is still referenced (ON DELETE RESTRICT)', async () => {
    const resourceId = (await createResource(payload)).id
    await createSlot(payload, { resourceId, capacity: 1 })
    await expect(query(sql`DELETE FROM resources WHERE id = ${resourceId}`)).rejects.toThrow()
  })

  it('down() removes the module indexes and up() restores them', async () => {
    await down({ db: drizzle() } as unknown as MigrateDownArgs)
    expect(await indexNames()).not.toContain('slots_resource_starts_at_idx')

    await up({ db: drizzle() } as unknown as MigrateUpArgs)
    expect(await indexNames()).toContain('slots_resource_starts_at_idx')
  })
})
