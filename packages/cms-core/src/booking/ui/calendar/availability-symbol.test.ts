import { describe, expect, it } from 'vitest'

import { getAvailabilityTier, isTierSelectable } from './availability-symbol'

describe('getAvailabilityTier', () => {
  it('returns closed (−) when no slot exists for a cell', () => {
    expect(getAvailabilityTier(undefined)).toEqual({ symbol: '−', labelKey: 'closed' })
  })

  it('returns full (×) when remaining_capacity is 0, regardless of capacity', () => {
    expect(getAvailabilityTier({ capacity: 5, remaining_capacity: 0 })).toEqual({ symbol: '×', labelKey: 'full' })
    expect(getAvailabilityTier({ capacity: 0, remaining_capacity: 0 })).toEqual({ symbol: '×', labelKey: 'full' })
  })

  it('returns few (△) when remaining/capacity is low but nonzero', () => {
    expect(getAvailabilityTier({ capacity: 10, remaining_capacity: 1 })).toEqual({ symbol: '△', labelKey: 'few' })
  })

  it('treats the few-remaining boundary (ratio exactly 0.3) as few', () => {
    expect(getAvailabilityTier({ capacity: 10, remaining_capacity: 3 })).toEqual({ symbol: '△', labelKey: 'few' })
  })

  it('returns available (○) for a mid-range ratio', () => {
    expect(getAvailabilityTier({ capacity: 10, remaining_capacity: 5 })).toEqual({ symbol: '○', labelKey: 'available' })
  })

  it('treats the plenty boundary (ratio exactly 0.7) as plenty', () => {
    expect(getAvailabilityTier({ capacity: 10, remaining_capacity: 7 })).toEqual({ symbol: '◎', labelKey: 'plenty' })
  })

  it('returns plenty (◎) when remaining equals capacity', () => {
    expect(getAvailabilityTier({ capacity: 4, remaining_capacity: 4 })).toEqual({ symbol: '◎', labelKey: 'plenty' })
  })

  it('returns plenty (◎) for a single-capacity slot that is fully open', () => {
    expect(getAvailabilityTier({ capacity: 1, remaining_capacity: 1 })).toEqual({ symbol: '◎', labelKey: 'plenty' })
  })
})

describe('isTierSelectable', () => {
  it('is selectable for plenty, available, and few', () => {
    expect(isTierSelectable('plenty')).toBe(true)
    expect(isTierSelectable('available')).toBe(true)
    expect(isTierSelectable('few')).toBe(true)
  })

  it('is not selectable for full or closed', () => {
    expect(isTierSelectable('full')).toBe(false)
    expect(isTierSelectable('closed')).toBe(false)
  })
})
