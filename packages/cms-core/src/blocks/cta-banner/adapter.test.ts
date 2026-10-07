import { describe, it, expect } from 'vitest'
import { adaptCTABannerBlock } from './adapter'

describe('adaptCTABannerBlock', () => {
  it('omits textLink when only label or only href is present', () => {
    // Arrange
    const raw = {
      heading: 'Heading',
      primaryButton: { label: 'Go', href: '/go' },
      textLink: { label: 'Download' }, // href missing
    }

    // Act
    const result = adaptCTABannerBlock(raw)

    // Assert
    expect(result.textLink).toBeUndefined()
  })

  it('includes textLink when both label and href are present', () => {
    // Arrange
    const raw = {
      heading: 'Heading',
      primaryButton: { label: 'Go', href: '/go' },
      textLink: { label: 'Download the brochure', href: '/brochure.pdf' },
    }

    // Act
    const result = adaptCTABannerBlock(raw)

    // Assert
    expect(result.textLink).toEqual({ label: 'Download the brochure', href: '/brochure.pdf' })
  })

  it('omits contactStrip when showContactStrip is false even if contactStrip data is present', () => {
    // Arrange
    const raw = {
      heading: 'Heading',
      primaryButton: { label: 'Go', href: '/go' },
      showContactStrip: false,
      contactStrip: { phone: '0800000000', email: 'info@example.com', hours: '9-18' },
    }

    // Act
    const result = adaptCTABannerBlock(raw)

    // Assert
    expect(result.contactStrip).toBeUndefined()
  })

  it('includes contactStrip when showContactStrip is true and the injected data has phone/email', () => {
    // Arrange
    const raw = {
      heading: 'Heading',
      primaryButton: { label: 'Go', href: '/go' },
      showContactStrip: true,
      contactStrip: { phone: '[080-7701-3004]', email: 'info@techmirai-ai.com', hours: '[Weekdays 9:00–18:00]' },
    }

    // Act
    const result = adaptCTABannerBlock(raw)

    // Assert
    expect(result.contactStrip).toEqual({
      phone: '[080-7701-3004]',
      email: 'info@techmirai-ai.com',
      hours: '[Weekdays 9:00–18:00]',
    })
  })

  it('still parses secondaryButton (pre-existing behavior) alongside the new fields', () => {
    // Arrange
    const raw = {
      heading: 'Heading',
      primaryButton: { label: 'Go', href: '/go' },
      secondaryButton: { label: 'Ask us on LINE', href: 'https://line.me/R/ti/p/~example' },
    }

    // Act
    const result = adaptCTABannerBlock(raw)

    // Assert
    expect(result.secondaryButton).toEqual({ label: 'Ask us on LINE', href: 'https://line.me/R/ti/p/~example' })
  })
})
