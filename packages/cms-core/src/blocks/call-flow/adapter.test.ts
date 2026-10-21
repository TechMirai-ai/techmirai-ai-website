import { describe, expect, it } from 'vitest'
import { adaptCallFlowBlock } from './adapter'

describe('adaptCallFlowBlock', () => {
  it('maps steps, dashboard fields and the AI / people lists', () => {
    const props = adaptCallFlowBlock({
      heading: 'How it works',
      steps: [{ label: 'A customer calls' }, { label: 'AI answers' }],
      dashboardFields: [{ label: 'Urgency', value: 'Medium (dummy)' }],
      aiItems: [{ text: 'After-hours capture' }],
      humanItems: [{ text: 'Complaints' }],
    })

    expect(props.steps.map((s) => s.label)).toEqual(['A customer calls', 'AI answers'])
    expect(props.dashboardFields).toEqual([{ label: 'Urgency', value: 'Medium (dummy)' }])
    expect(props.aiItems).toEqual(['After-hours capture'])
    expect(props.humanItems).toEqual(['Complaints'])
  })

  it('drops empty steps and falls back to English control labels', () => {
    const props = adaptCallFlowBlock({ steps: [{ label: '' }, { label: 'Only step' }] })

    expect(props.steps).toHaveLength(1)
    expect(props.pauseLabel).toBe('Pause animation')
    expect(props.playLabel).toBe('Play animation')
  })

  it('returns safe empty values for missing or malformed input', () => {
    const props = adaptCallFlowBlock(null)

    expect(props.steps).toEqual([])
    expect(props.dashboardFields).toEqual([])
    expect(props.aiItems).toEqual([])
  })
})
