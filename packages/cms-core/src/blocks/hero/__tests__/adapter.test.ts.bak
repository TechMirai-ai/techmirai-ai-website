import { describe, it, expect } from 'vitest'
import { adaptHeroBlock } from '../adapter'

describe('adaptHeroBlock', () => {
  describe('safe defaults', () => {
    it('returns safe defaults for undefined input', () => {
      const result = adaptHeroBlock(undefined)
      expect(result.heading).toBe('')
      expect(result.variant).toBe('center')
      expect(result.minHeight).toBe('large')
      expect(result.overlayOpacity).toBe(50)
      expect(result.transparentHeader).toBe(false)
      expect(result.ctaPrimary.label).toBe('')
      expect(result.ctaPrimary.href).toBe('/')
    })

    it('returns safe defaults for empty object', () => {
      const result = adaptHeroBlock({})
      expect(result.heading).toBe('')
      expect(result.overlayOpacity).toBe(50)
      expect(result.transparentHeader).toBe(false)
    })

    it('omits subheading when not present', () => {
      const result = adaptHeroBlock({})
      expect('subheading' in result).toBe(false)
    })

    it('omits ctaSecondary when not present', () => {
      const result = adaptHeroBlock({})
      expect('ctaSecondary' in result).toBe(false)
    })

    it('omits backgroundImageUrl when not present', () => {
      const result = adaptHeroBlock({})
      expect('backgroundImageUrl' in result).toBe(false)
    })
  })

  describe('heading', () => {
    it('maps heading string', () => {
      const result = adaptHeroBlock({ heading: 'Hello World' })
      expect(result.heading).toBe('Hello World')
    })

    it('falls back to empty string for non-string heading', () => {
      const result = adaptHeroBlock({ heading: 42 })
      expect(result.heading).toBe('')
    })
  })

  describe('subheading', () => {
    it('maps subheading when present', () => {
      const result = adaptHeroBlock({ subheading: 'Sub text' })
      expect(result.subheading).toBe('Sub text')
    })

    it('omits subheading for empty string', () => {
      const result = adaptHeroBlock({ subheading: '' })
      expect('subheading' in result).toBe(false)
    })
  })

  describe('ctaPrimary', () => {
    it('maps ctaPrimary label and href', () => {
      const result = adaptHeroBlock({ ctaPrimary: { label: 'Click me', href: '/go' } })
      expect(result.ctaPrimary.label).toBe('Click me')
      expect(result.ctaPrimary.href).toBe('/go')
    })

    it('defaults ctaPrimary.href to "/" when missing', () => {
      const result = adaptHeroBlock({ ctaPrimary: { label: 'Go' } })
      expect(result.ctaPrimary.href).toBe('/')
    })
  })

  describe('ctaSecondary', () => {
    it('maps ctaSecondary when both label and href are present', () => {
      const result = adaptHeroBlock({ ctaSecondary: { label: 'More', href: '/more' } })
      expect(result.ctaSecondary?.label).toBe('More')
      expect(result.ctaSecondary?.href).toBe('/more')
    })

    it('omits ctaSecondary when label is empty', () => {
      const result = adaptHeroBlock({ ctaSecondary: { label: '', href: '/x' } })
      expect('ctaSecondary' in result).toBe(false)
    })

    it('omits ctaSecondary when href is empty', () => {
      const result = adaptHeroBlock({ ctaSecondary: { label: 'Go', href: '' } })
      expect('ctaSecondary' in result).toBe(false)
    })

    it('omits ctaSecondary when fields are missing', () => {
      const result = adaptHeroBlock({ ctaSecondary: {} })
      expect('ctaSecondary' in result).toBe(false)
    })
  })

  describe('backgroundImageUrl', () => {
    it('extracts url from nested backgroundImage object', () => {
      const result = adaptHeroBlock({ backgroundImage: { url: '/hero.jpg' } })
      expect(result.backgroundImageUrl).toBe('/hero.jpg')
    })

    it('omits backgroundImageUrl when backgroundImage has no url', () => {
      const result = adaptHeroBlock({ backgroundImage: {} })
      expect('backgroundImageUrl' in result).toBe(false)
    })

    it('omits backgroundImageUrl when backgroundImage is absent', () => {
      const result = adaptHeroBlock({})
      expect('backgroundImageUrl' in result).toBe(false)
    })
  })

  describe('overlayOpacity', () => {
    it('maps overlayOpacity number', () => {
      const result = adaptHeroBlock({ overlayOpacity: 75 })
      expect(result.overlayOpacity).toBe(75)
    })

    it('defaults to 50 when absent', () => {
      const result = adaptHeroBlock({})
      expect(result.overlayOpacity).toBe(50)
    })

    it('defaults to 50 for non-number value', () => {
      const result = adaptHeroBlock({ overlayOpacity: 'high' })
      expect(result.overlayOpacity).toBe(50)
    })
  })

  describe('variant', () => {
    it.each(['center', 'left', 'split'] as const)('maps valid variant "%s"', (v) => {
      const result = adaptHeroBlock({ variant: v })
      expect(result.variant).toBe(v)
    })

    it('falls back to "center" for invalid variant', () => {
      const result = adaptHeroBlock({ variant: 'diagonal' })
      expect(result.variant).toBe('center')
    })
  })

  describe('minHeight', () => {
    it.each(['full', 'large', 'medium', 'small'] as const)('maps valid minHeight "%s"', (h) => {
      const result = adaptHeroBlock({ minHeight: h })
      expect(result.minHeight).toBe(h)
    })

    it('falls back to "large" for invalid minHeight', () => {
      const result = adaptHeroBlock({ minHeight: 'tiny' })
      expect(result.minHeight).toBe('large')
    })
  })

  describe('transparentHeader', () => {
    it('maps true', () => {
      const result = adaptHeroBlock({ transparentHeader: true })
      expect(result.transparentHeader).toBe(true)
    })

    it('maps false', () => {
      const result = adaptHeroBlock({ transparentHeader: false })
      expect(result.transparentHeader).toBe(false)
    })

    it('defaults to false when absent', () => {
      const result = adaptHeroBlock({})
      expect(result.transparentHeader).toBe(false)
    })
  })
})
