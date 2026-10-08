import { describe, it, expect } from 'vitest'
import { adaptExampleChatBlock } from './adapter'

describe('adaptExampleChatBlock', () => {
  it('parses customer and ai turns in order', () => {
    // Arrange
    const raw = {
      customerLabel: 'Patient',
      turns: [
        { speaker: 'customer', message: 'Are you open on Saturday afternoon?' },
        { speaker: 'ai', message: 'On Saturdays we are open [9:00–13:00].' },
      ],
    }

    // Act
    const result = adaptExampleChatBlock(raw)

    // Assert
    expect(result.customerLabel).toBe('Patient')
    expect(result.turns).toEqual([
      { speaker: 'customer', message: 'Are you open on Saturday afternoon?' },
      { speaker: 'ai', message: 'On Saturdays we are open [9:00–13:00].' },
    ])
  })

  it('drops turns with no message', () => {
    // Arrange
    const raw = {
      customerLabel: 'Customer',
      turns: [{ speaker: 'customer', message: '' }, { speaker: 'ai', message: 'Hello' }],
    }

    // Act
    const result = adaptExampleChatBlock(raw)

    // Assert
    expect(result.turns).toEqual([{ speaker: 'ai', message: 'Hello' }])
  })

  it('defaults an unrecognized speaker value to customer', () => {
    // Arrange
    const raw = { customerLabel: 'Guest', turns: [{ speaker: 'unknown', message: 'Hi' }] }

    // Act
    const result = adaptExampleChatBlock(raw)

    // Assert
    expect(result.turns).toEqual([{ speaker: 'customer', message: 'Hi' }])
  })

  it('returns an empty turns array and empty label when raw is not an object', () => {
    // Act
    const result = adaptExampleChatBlock(null)

    // Assert
    expect(result.customerLabel).toBe('')
    expect(result.turns).toEqual([])
  })
})
