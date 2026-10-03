import type { Payload } from 'payload'

/** Minimal shape returned by Payload create/find without generated types. */
export type TestDoc = { id: number | string; [key: string]: unknown }

const DAY_MS = 24 * 60 * 60 * 1000
const HALF_HOUR_MS = 30 * 60 * 1000

export async function createResource(
  payload: Payload,
  overrides: Record<string, unknown> = {},
): Promise<TestDoc> {
  const doc = await payload.create({
    collection: 'resources',
    data: { name: '診察室A', kind: 'room', active: true, ...overrides },
  })
  return doc as TestDoc
}

export async function createService(
  payload: Payload,
  overrides: Record<string, unknown> = {},
): Promise<TestDoc> {
  const doc = await payload.create({
    collection: 'bookable-services',
    data: { name: '一般診察', durationMin: 30, firstVisitAllowed: true, active: true, ...overrides },
  })
  return doc as TestDoc
}

export async function createCustomer(
  payload: Payload,
  overrides: Record<string, unknown> = {},
): Promise<TestDoc> {
  const doc = await payload.create({
    collection: 'customers',
    data: {
      familyName: '山田',
      givenName: '太郎',
      familyNameKana: 'ヤマダ',
      givenNameKana: 'タロウ',
      phone: '090-0000-0000',
      ...overrides,
    },
  })
  return doc as TestDoc
}

export interface CreateSlotArgs {
  resourceId: number | string
  capacity?: number
  status?: 'open' | 'blocked' | 'closed'
  startsAt?: string
  endsAt?: string
}

export async function createSlot(payload: Payload, args: CreateSlotArgs): Promise<TestDoc> {
  const startsAt = args.startsAt ?? new Date(Date.now() + DAY_MS).toISOString()
  const endsAt = args.endsAt ?? new Date(Date.now() + DAY_MS + HALF_HOUR_MS).toISOString()
  const doc = await payload.create({
    collection: 'slots',
    data: {
      resource: args.resourceId,
      startsAt,
      endsAt,
      capacity: args.capacity ?? 1,
      bookedCount: 0,
      status: args.status ?? 'open',
    },
  })
  return doc as TestDoc
}

export async function getSlot(payload: Payload, id: number | string): Promise<TestDoc> {
  const doc = await payload.findByID({ collection: 'slots', id })
  return doc as TestDoc
}
