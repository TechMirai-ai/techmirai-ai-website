import { describe, expect, it } from 'vitest'
import {
  adaptDayFlow, adaptIconCards, adaptRoleSplit, adaptRoutingDashboard, adaptVoiceHero,
} from './adapters'

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

describe('adaptRoleSplit', () => {
  it('collects the AI and people lists', () => {
    const props = adaptRoleSplit({ aiItems: [{ text: 'Routine' }], humanItems: [{ text: 'Complaints' }, { text: '' }] })

    expect(props.aiItems).toEqual(['Routine'])
    expect(props.humanItems).toEqual(['Complaints'])
  })
})
