import { describe, expect, it, vi } from 'vitest'

import { fetchDueNotifications } from './due-notifications'

function rowFixture(id: number) {
  return {
    id,
    channel: 'email',
    recipient: `patient-${id}@example.com`,
    subject: `Subject ${id}`,
    html: `<p>${id}</p>`,
    text: `${id}`,
    dedupeKey: `email:booking-confirmation:${id}`,
    attempts: 0,
  }
}

function fakePayload(rows: ReturnType<typeof rowFixture>[]) {
  const execute = vi.fn(async () => ({ rows }))
  return {
    payload: { db: { drizzle: { execute } } } as never,
    execute,
  }
}

describe('fetchDueNotifications', () => {
  it('issues exactly one SELECT and returns the mapped rows, however many are due', async () => {
    const rows = Array.from({ length: 50 }, (_, i) => rowFixture(i + 1))
    const { payload, execute } = fakePayload(rows)

    const result = await fetchDueNotifications(payload)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(50)
    expect(result[0]).toEqual(rows[0])
  })

  it('passes the template key through so the cron can tell customer rows from staff rows', async () => {
    const { payload } = fakePayload([
      { ...rowFixture(1), templateKey: 'booking-reminder' },
      { ...rowFixture(2), templateKey: 'staff-appointment-created' },
    ] as never)

    const result = await fetchDueNotifications(payload)

    expect(result.map((r) => r.templateKey)).toEqual(['booking-reminder', 'staff-appointment-created'])
  })

  it('issues exactly one SELECT even when zero rows are due', async () => {
    const { payload, execute } = fakePayload([])

    const result = await fetchDueNotifications(payload)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })

  it('never issues more than one query regardless of the requested limit', async () => {
    const rows = Array.from({ length: 3 }, (_, i) => rowFixture(i + 1))
    const { payload, execute } = fakePayload(rows)

    await fetchDueNotifications(payload, 500)

    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('coerces attempts to a number even when the driver returns it as a string (Postgres numeric column)', async () => {
    // node-postgres returns `numeric`/`decimal` columns as strings on a raw
    // driver read — notifications.attempts is `numeric`. Left uncoerced,
    // send.ts's `notification.attempts + 1` becomes string concatenation
    // ("1" + 1 === "11") instead of arithmetic, corrupting the retry count.
    const { payload } = fakePayload([{ ...rowFixture(1), attempts: '1' as unknown as number }])

    const result = await fetchDueNotifications(payload)

    expect(result[0]?.attempts).toBe(1)
    expect(typeof result[0]?.attempts).toBe('number')
  })
})
