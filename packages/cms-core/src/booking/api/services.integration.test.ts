import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { handleListBookableServices } from './services'
import { createService } from '../test/factories'
import { getTestPayload } from '../test/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('handleListBookableServices', () => {
  it('returns an array shape even when no active services match', async () => {
    // Not asserting a literal [] — this integration suite shares one
    // throwaway Postgres across every *.integration.test.ts file in the run
    // (fileParallelism:false, one global setup/teardown), so other files'
    // beforeAll hooks may have already created active services by the time
    // this runs. Only the shape/type is guaranteed here.
    const result = await handleListBookableServices(payload, { locale: 'ja' })
    expect(Array.isArray(result.services)).toBe(true)
  })

  it('excludes inactive services', async () => {
    await createService(payload, { name: 'Active Service', sortOrder: 1, active: true })
    await createService(payload, { name: 'Inactive Service', sortOrder: 2, active: false })

    const result = await handleListBookableServices(payload, { locale: 'ja' })

    expect(result.services.map((s) => s.name)).toContain('Active Service')
    expect(result.services.map((s) => s.name)).not.toContain('Inactive Service')
  })

  it('respects sortOrder ascending', async () => {
    await createService(payload, { name: 'Second', sortOrder: 20 })
    await createService(payload, { name: 'First', sortOrder: 10 })

    const result = await handleListBookableServices(payload, { locale: 'ja' })
    const names = result.services.map((s) => s.name)

    expect(names.indexOf('First')).toBeLessThan(names.indexOf('Second'))
  })

  it('maps camelCase Payload fields to the snake_case response shape', async () => {
    await createService(payload, {
      name: 'Mapped Service',
      durationMin: 45,
      priceYen: 5000,
      firstVisitAllowed: false,
      sortOrder: 30,
    })

    const result = await handleListBookableServices(payload, { locale: 'ja' })
    const service = result.services.find((s) => s.name === 'Mapped Service')

    expect(service).toMatchObject({
      duration_min: 45,
      price_yen: 5000,
      first_visit_allowed: false,
    })
  })

  it('returns null price_yen for services with no fixed price', async () => {
    await createService(payload, { name: 'No Price Service', priceYen: undefined, sortOrder: 40 })

    const result = await handleListBookableServices(payload, { locale: 'ja' })
    const service = result.services.find((s) => s.name === 'No Price Service')

    expect(service?.price_yen).toBeNull()
  })

  it('returns the localized name for the requested locale, not the site default', async () => {
    const created = await payload.create({
      collection: 'bookable-services',
      locale: 'ja',
      data: {
        name: '日本語サービス',
        durationMin: 30,
        firstVisitAllowed: true,
        active: true,
        sortOrder: 50,
      },
    })
    await payload.update({
      collection: 'bookable-services',
      id: created.id,
      locale: 'en',
      data: { name: 'English Service Name' },
    })

    const enResult = await handleListBookableServices(payload, { locale: 'en' })
    const jaResult = await handleListBookableServices(payload, { locale: 'ja' })

    expect(enResult.services.find((s) => s.id === created.id)?.name).toBe('English Service Name')
    expect(jaResult.services.find((s) => s.id === created.id)?.name).toBe('日本語サービス')
  })
})
