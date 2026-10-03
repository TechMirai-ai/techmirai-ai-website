import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import type { ReactNode } from 'react'
import { HeroBlock } from '../component'
import type { HeroBlockProps } from '../types'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, variants: _v, initial: _i, animate: _a, style, className, ...rest }: {
      children?: ReactNode; variants?: unknown; initial?: unknown; animate?: unknown;
      style?: React.CSSProperties; className?: string; [k: string]: unknown
    }) => React.createElement('div', { style, className, ...rest }, children),
    h1: ({ children, variants: _v, id, className }: {
      children?: ReactNode; variants?: unknown; id?: string; className?: string
    }) => React.createElement('h1', { id, className }, children),
    p: ({ children, variants: _v, className }: {
      children?: ReactNode; variants?: unknown; className?: string
    }) => React.createElement('p', { className }, children),
  },
  useReducedMotion: () => false,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => 0,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseProps(overrides: Partial<HeroBlockProps> = {}): HeroBlockProps {
  return {
    heading: 'Build Your Career',
    ctaPrimary: { label: 'Browse Jobs', href: '/jobs' },
    overlayOpacity: 50,
    variant: 'center',
    minHeight: 'large',
    transparentHeader: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HeroBlock', () => {
  describe('structure', () => {
    it('renders a <section> element', () => {
      render(<HeroBlock {...baseProps()} />)
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('renders heading inside an <h1>', () => {
      render(<HeroBlock {...baseProps()} />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('heading text matches prop', () => {
      render(<HeroBlock {...baseProps({ heading: 'Hello Japan' })} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello Japan')
    })
  })

  describe('subheading', () => {
    it('renders subheading paragraph when prop is provided', () => {
      render(<HeroBlock {...baseProps({ subheading: 'Some subtitle' })} />)
      expect(screen.getByText('Some subtitle')).toBeInTheDocument()
    })

    it('does NOT render a subheading paragraph when prop is absent', () => {
      const props = baseProps()
      render(<HeroBlock {...props} />)
      // only h1 heading present; no extra paragraph
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
    })
  })

  describe('primary CTA', () => {
    it('renders primary CTA as <a> link', () => {
      render(<HeroBlock {...baseProps()} />)
      const link = screen.getByRole('link', { name: 'Browse Jobs' })
      expect(link.tagName).toBe('A')
    })

    it('primary CTA has the correct href', () => {
      render(<HeroBlock {...baseProps()} />)
      const link = screen.getByRole('link', { name: 'Browse Jobs' })
      expect(link).toHaveAttribute('href', '/jobs')
    })

    it('primary CTA link has min-h-[44px] class for touch target', () => {
      render(<HeroBlock {...baseProps()} />)
      const link = screen.getByRole('link', { name: 'Browse Jobs' })
      expect(link.className).toContain('min-h-[44px]')
    })
  })

  describe('secondary CTA', () => {
    it('renders secondary CTA when ctaSecondary prop provided', () => {
      render(<HeroBlock {...baseProps({ ctaSecondary: { label: 'Our Services', href: '/services' } })} />)
      expect(screen.getByRole('link', { name: 'Our Services' })).toBeInTheDocument()
    })

    it('does NOT render secondary CTA when prop is absent', () => {
      render(<HeroBlock {...baseProps()} />)
      expect(screen.getAllByRole('link')).toHaveLength(1)
    })
  })

  describe('background image', () => {
    it('background wrapper has aria-hidden="true" when backgroundImageUrl is provided', () => {
      render(<HeroBlock {...baseProps({ backgroundImageUrl: '/hero.jpg' })} />)
      const hidden = document.querySelector('[aria-hidden="true"]')
      expect(hidden).toBeInTheDocument()
    })

    it('no background image element when backgroundImageUrl is absent', () => {
      render(<HeroBlock {...baseProps()} />)
      // Check specifically for the bg wrapper div (not the scroll SVG which is also aria-hidden)
      expect(document.querySelector('div[aria-hidden="true"]')).not.toBeInTheDocument()
    })
  })

  describe('transparentHeader', () => {
    it('section has data-transparent-header="true" when prop is true', () => {
      render(<HeroBlock {...baseProps({ transparentHeader: true })} />)
      const section = screen.getByRole('region')
      expect(section).toHaveAttribute('data-transparent-header', 'true')
    })

    it('section does NOT have data-transparent-header attribute when prop is false', () => {
      render(<HeroBlock {...baseProps({ transparentHeader: false })} />)
      const section = screen.getByRole('region')
      expect(section).not.toHaveAttribute('data-transparent-header')
    })
  })

  describe('variant alignment', () => {
    it('center variant applies centering class to content container', () => {
      const { container } = render(<HeroBlock {...baseProps({ variant: 'center' })} />)
      const section = container.querySelector('section')
      expect(section?.className).toContain('justify-center')
    })

    it('left variant does not apply justify-center to section', () => {
      const { container } = render(<HeroBlock {...baseProps({ variant: 'left' })} />)
      const section = container.querySelector('section')
      expect(section?.className).not.toContain('justify-center')
    })
  })

  describe('scroll-down button', () => {
    it('renders scroll-down button for minHeight="full"', () => {
      render(<HeroBlock {...baseProps({ minHeight: 'full' })} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders scroll-down button for minHeight="large"', () => {
      render(<HeroBlock {...baseProps({ minHeight: 'large' })} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('does NOT render scroll-down button for minHeight="medium"', () => {
      render(<HeroBlock {...baseProps({ minHeight: 'medium' })} />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('does NOT render scroll-down button for minHeight="small"', () => {
      render(<HeroBlock {...baseProps({ minHeight: 'small' })} />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
