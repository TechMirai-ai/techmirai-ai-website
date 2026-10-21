import { describe, expect, it } from 'vitest'
import { adaptDemoSimulatorBlock } from './adapter'

const scenario = {
  title: 'After-hours inquiry',
  description: 'A caller phones at night.',
  businessName: 'Sample Call Center (fictional business)',
  turns: [
    { speaker: 'caller', text: 'Hello' },
    { speaker: 'ai', text: 'Thank you for calling' },
  ],
  summaryRows: [{ label: 'Urgency', value: 'Low' }],
}

describe('adaptDemoSimulatorBlock', () => {
  it('maps scenarios with speakers, transcript turns and summary rows', () => {
    const props = adaptDemoSimulatorBlock({ scenarios: [scenario] })

    expect(props.scenarios).toHaveLength(1)
    expect(props.scenarios[0]?.turns.map((t) => t.speaker)).toEqual(['caller', 'ai'])
    expect(props.scenarios[0]?.summaryRows).toEqual([{ label: 'Urgency', value: 'Low' }])
  })

  it('drops scenarios that have no title or no transcript', () => {
    const props = adaptDemoSimulatorBlock({
      scenarios: [scenario, { ...scenario, title: '' }, { ...scenario, turns: [] }],
    })

    expect(props.scenarios).toHaveLength(1)
  })

  it('treats any unknown speaker as the caller and defaults the privacy link', () => {
    const props = adaptDemoSimulatorBlock({
      scenarios: [{ ...scenario, turns: [{ speaker: 'robot', text: 'Hi' }] }],
    })

    expect(props.scenarios[0]?.turns[0]?.speaker).toBe('caller')
    expect(props.privacyHref).toBe('/privacy')
  })
})
