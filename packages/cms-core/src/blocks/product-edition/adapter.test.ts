import { describe, it, expect } from 'vitest'
import { adaptProductEditionBlock } from './adapter'

describe('adaptProductEditionBlock', () => {
  it('passes badge through as free-form text (not a fixed enum)', () => {
    // Arrange
    const raw = { heading: 'AI受付 Voice', badge: 'In development · Demo available' }

    // Act
    const result = adaptProductEditionBlock(raw)

    // Assert
    expect(result.badge).toBe('In development · Demo available')
  })

  it('omits waysToStart when the array is empty', () => {
    // Arrange
    const raw = { heading: 'AI受付 Voice', waysToStart: [] }

    // Act
    const result = adaptProductEditionBlock(raw)

    // Assert
    expect(result.waysToStart).toBeUndefined()
  })

  it('keeps only one waysToStart entry when the second is omitted (hideable CONFIRM item)', () => {
    // Arrange
    const raw = { heading: 'AI受付 Web', waysToStart: [{ text: 'New website with AI受付 built in' }] }

    // Act
    const result = adaptProductEditionBlock(raw)

    // Assert
    expect(result.waysToStart).toEqual([{ text: 'New website with AI受付 built in' }])
  })

  it('omits closingLine and button fields when absent (Web edition has neither)', () => {
    // Arrange
    const raw = { heading: 'AI受付 Web', badge: 'Available now' }

    // Act
    const result = adaptProductEditionBlock(raw)

    // Assert
    expect(result.closingLine).toBeUndefined()
    expect(result.buttonLabel).toBeUndefined()
    expect(result.buttonHref).toBeUndefined()
  })

  it('includes closingLine and button fields when present (Voice edition)', () => {
    // Arrange
    const raw = {
      heading: 'AI受付 Voice',
      closingLine: 'Interested? Ask for a demo.',
      buttonLabel: 'Request a voice demo',
      buttonHref: '/booking',
    }

    // Act
    const result = adaptProductEditionBlock(raw)

    // Assert
    expect(result.closingLine).toBe('Interested? Ask for a demo.')
    expect(result.buttonLabel).toBe('Request a voice demo')
    expect(result.buttonHref).toBe('/booking')
  })
})
