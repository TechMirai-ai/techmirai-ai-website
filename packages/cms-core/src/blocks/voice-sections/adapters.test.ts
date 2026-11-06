import { describe, expect, it } from 'vitest'
import {
  adaptCallFlow, adaptDayFlow, adaptIconCards, adaptRoleSplit, adaptRoutingDashboard, adaptVoiceHero, adaptWhyAi,
} from './adapters'

describe('adaptCallFlow', () => {
  const card = (n: number) => ({ icon: 'fileText', tone: 'light', title: `Card ${n}`, text: `Text ${n}` })

  it('keeps up to three path cards and drops any beyond the third', () => {
    const props = adaptCallFlow({ cards: [1, 2, 3, 4].map(card) })

    expect(props.cards.map((c) => c.title)).toEqual(['Card 1', 'Card 2', 'Card 3'])
  })

  it('maps the separate summary section when it has a title', () => {
    const props = adaptCallFlow({ summaryIcon: 'fileText', summaryTitle: 'Summary and record', summaryText: 'Overview.' })

    expect(props.summary).toEqual({ icon: 'fileText', title: 'Summary and record', text: 'Overview.' })
  })

  it('has no summary section when the title is missing or blank', () => {
    expect(adaptCallFlow({ summaryText: 'Orphan text' }).summary).toBeNull()
    expect(adaptCallFlow({ summaryTitle: '  ' }).summary).toBeNull()
  })

  it('falls back to the phone icon for an unknown summary icon', () => {
    expect(adaptCallFlow({ summaryTitle: 'S', summaryIcon: 'nope' }).summary?.icon).toBe('phone')
  })

  it('drops cards without a title', () => {
    const props = adaptCallFlow({ cards: [card(1), { ...card(2), title: '' }] })

    expect(props.cards).toHaveLength(1)
  })
})

describe('adaptVoiceHero', () => {
  it('maps buttons and call-flow nodes, dropping nodes without a label', () => {
    const props = adaptVoiceHero({
      heading: 'Heading',
      primaryButton: { label: 'Try', href: '/demo' },
      secondaryButton: { label: '', href: '/x' },
      nodes: [{ icon: 'phone', label: 'Call', sub: 'in' }, { icon: 'users', label: '' }],
    })

    expect(props.primaryButton).toEqual({ label: 'Try', href: '/demo' })
    expect(props.secondaryButton).toBeNull()
    expect(props.nodes).toEqual([{ icon: 'phone', label: 'Call', sub: 'in' }])
    expect(props.pauseLabel).toBe('Pause animation')
  })

  it('falls back to the phone icon for an unknown icon name', () => {
    const props = adaptVoiceHero({ nodes: [{ icon: 'not-an-icon', label: 'X' }] })

    expect(props.nodes[0]?.icon).toBe('phone')
  })

  it('keeps a same-site or https background video and drops anything else', () => {
    expect(adaptVoiceHero({ backgroundVideo: '/video/hero.mp4' }).backgroundVideo).toBe('/video/hero.mp4')
    expect(adaptVoiceHero({ backgroundVideo: 'https://example.test/hero.mp4' }).backgroundVideo).toBe('https://example.test/hero.mp4')
    expect(adaptVoiceHero({ backgroundVideo: 'javascript:alert(1)' }).backgroundVideo).toBe('')
    expect(adaptVoiceHero({ backgroundVideo: '//evil.test/hero.mp4' }).backgroundVideo).toBe('')
    expect(adaptVoiceHero({ backgroundVideo: 'http://example.test/hero.mp4' }).backgroundVideo).toBe('')
  })

  it('has no background video when the field is missing', () => {
    expect(adaptVoiceHero({}).backgroundVideo).toBe('')
  })
})

describe('adaptIconCards', () => {
  it('defaults to 4 columns and a green tone, and keeps only titled cards', () => {
    const props = adaptIconCards({
      cards: [{ title: 'A', text: 'a', tone: 'purple' }, { title: '' }],
    })

    expect(props.columns).toBe(4)
    expect(props.cards).toHaveLength(1)
    expect(props.cards[0]?.tone).toBe('green')
  })

  it('returns a call-to-action card only when it has a label', () => {
    expect(adaptIconCards({ cards: [], cta: { label: '' } }).cta).toBeNull()
    expect(adaptIconCards({ cards: [], cta: { label: 'Start', href: '/demo' } }).cta?.href).toBe('/demo')
  })
})

describe('adaptDayFlow', () => {
  it('keeps valid tones and falls back to day for unknown ones', () => {
    const props = adaptDayFlow({ steps: [{ title: 'Night', tone: 'night' }, { title: 'Odd', tone: 'x' }] })

    expect(props.steps.map((s) => s.tone)).toEqual(['night', 'day'])
  })
})

describe('adaptRoutingDashboard', () => {
  it('maps table rows and treats unknown row tones as ok', () => {
    const props = adaptRoutingDashboard({
      dashboard: {
        columns: [{ text: 'Time' }],
        rows: [{ time: '09:00', status: 'Needs callback', tone: 'alert' }, { time: '09:01', tone: 'weird' }],
      },
    })

    expect(props.dashboard.columns).toEqual(['Time'])
    expect(props.dashboard.rows.map((r) => r.tone)).toEqual(['alert', 'ok'])
  })

  it('returns safe empties for malformed input', () => {
    const props = adaptRoutingDashboard(undefined)

    expect(props.leftItems).toEqual([])
    expect(props.dashboard.rows).toEqual([])
  })
})

describe('adaptWhyAi', () => {
  it('maps rows, keeps noCheck only when true, and drops rows missing a label or AI text', () => {
    const props = adaptWhyAi({
      pill: 'Why AI',
      rows: [
        { label: 'Availability', human: 'Set shifts', ai: 'Day or night' },
        { label: 'Complaints', human: 'Strong', ai: 'Handed to staff', noCheck: true },
        { label: '', human: 'x', ai: 'y' },
        { label: 'No AI text', human: 'x', ai: '' },
      ],
    })

    expect(props.pill).toBe('Why AI')
    expect(props.rows).toEqual([
      { label: 'Availability', human: 'Set shifts', ai: 'Day or night', noCheck: false },
      { label: 'Complaints', human: 'Strong', ai: 'Handed to staff', noCheck: true },
    ])
  })

  it('returns empty strings and no rows for missing data', () => {
    const props = adaptWhyAi(undefined)

    expect(props.heading).toBe('')
    expect(props.rows).toEqual([])
  })
})

describe('adaptRoleSplit', () => {
  it('collects the AI and people lists', () => {
    const props = adaptRoleSplit({ aiItems: [{ text: 'Routine' }], humanItems: [{ text: 'Complaints' }, { text: '' }] })

    expect(props.aiItems).toEqual(['Routine'])
    expect(props.humanItems).toEqual(['Complaints'])
  })
})
