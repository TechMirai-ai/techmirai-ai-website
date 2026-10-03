import { describe, expect, it } from 'vitest'

import {
  bookableServiceSchema,
  listBookableServicesRequestSchema,
  listBookableServicesResponseSchema,
} from './schemas'

const validService = {
  id: 1,
  name: '一般診察',
  duration_min: 30,
  price_yen: 3000,
  first_visit_allowed: true,
}

describe('listBookableServicesRequestSchema', () => {
  it('accepts a well-formed locale', () => {
    expect(listBookableServicesRequestSchema.safeParse({ locale: 'en' }).success).toBe(true)
    expect(listBookableServicesRequestSchema.safeParse({ locale: 'ja' }).success).toBe(true)
  })

  it('accepts a locale with a region subtag', () => {
    expect(listBookableServicesRequestSchema.safeParse({ locale: 'ja-JP' }).success).toBe(true)
  })

  it('rejects a missing locale', () => {
    expect(listBookableServicesRequestSchema.safeParse({}).success).toBe(false)
  })

  it('rejects a too-short locale', () => {
    expect(listBookableServicesRequestSchema.safeParse({ locale: 'e' }).success).toBe(false)
  })

  it('rejects a locale that is not a recognized BCP-47-ish format', () => {
    expect(listBookableServicesRequestSchema.safeParse({ locale: 'xx-XX-XX' }).success).toBe(false)
    expect(listBookableServicesRequestSchema.safeParse({ locale: '12' }).success).toBe(false)
    expect(listBookableServicesRequestSchema.safeParse({ locale: 'EN' }).success).toBe(false)
  })
})

describe('bookableServiceSchema', () => {
  it('accepts a well-formed service', () => {
    expect(bookableServiceSchema.safeParse(validService).success).toBe(true)
  })

  it('accepts a null price_yen for services with no fixed price', () => {
    expect(bookableServiceSchema.safeParse({ ...validService, price_yen: null }).success).toBe(true)
  })

  it('rejects a negative price_yen', () => {
    expect(bookableServiceSchema.safeParse({ ...validService, price_yen: -100 }).success).toBe(false)
  })

  it('rejects a missing field', () => {
    const { name: _name, ...incomplete } = validService
    expect(bookableServiceSchema.safeParse(incomplete).success).toBe(false)
  })

  it('rejects a non-boolean first_visit_allowed', () => {
    expect(bookableServiceSchema.safeParse({ ...validService, first_visit_allowed: 'yes' }).success).toBe(false)
  })
})

describe('listBookableServicesResponseSchema', () => {
  it('accepts an array of services', () => {
    expect(listBookableServicesResponseSchema.safeParse({ services: [validService] }).success).toBe(true)
  })

  it('accepts an empty catalog', () => {
    expect(listBookableServicesResponseSchema.safeParse({ services: [] }).success).toBe(true)
  })
})
