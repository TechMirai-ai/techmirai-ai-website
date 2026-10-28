import { describe, expect, it } from 'vitest'
import { formatClock } from './format-clock'

describe('formatClock', () => {
  it('formats seconds under a minute and whole minutes', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(7)).toBe('0:07')
    expect(formatClock(106)).toBe('1:46')
  })

  it('rounds down fractional seconds', () => {
    expect(formatClock(59.9)).toBe('0:59')
  })

  it('adds hours only when needed', () => {
    expect(formatClock(3723)).toBe('1:02:03')
  })

  it('treats NaN, Infinity and negative values as zero', () => {
    expect(formatClock(Number.NaN)).toBe('0:00')
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('0:00')
    expect(formatClock(-5)).toBe('0:00')
  })
})
