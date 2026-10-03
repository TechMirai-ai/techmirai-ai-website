import { describe, expect, it } from 'vitest'

import { assertWithinCutoff } from './cutoff'

const NOW = new Date('2026-08-10T00:00:00.000Z')

function hoursFromNow(hours: number): string {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000).toISOString()
}

describe('assertWithinCutoff', () => {
  it('allows an appointment well beyond the cutoff', () => {
    expect(() => assertWithinCutoff(hoursFromNow(48), 24, NOW)).not.toThrow()
  })

  it('allows an appointment exactly at the cutoff boundary', () => {
    expect(() => assertWithinCutoff(hoursFromNow(24), 24, NOW)).not.toThrow()
  })

  it('rejects an appointment one second inside the cutoff', () => {
    const justInside = new Date(NOW.getTime() + 24 * 60 * 60 * 1000 - 1000).toISOString()
    expect(() => assertWithinCutoff(justInside, 24, NOW)).toThrow(
      expect.objectContaining({ code: 'CUTOFF_PASSED' }),
    )
  })

  it('rejects an appointment already in the past', () => {
    expect(() => assertWithinCutoff(hoursFromNow(-1), 24, NOW)).toThrow(
      expect.objectContaining({ code: 'CUTOFF_PASSED' }),
    )
  })

  it('allows anything when cutoffHours is 0', () => {
    expect(() => assertWithinCutoff(hoursFromNow(0.001), 0, NOW)).not.toThrow()
  })
})
