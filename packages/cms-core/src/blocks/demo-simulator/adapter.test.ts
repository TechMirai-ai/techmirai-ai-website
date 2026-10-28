import { describe, expect, it } from 'vitest'
import { adaptDemoSimulatorBlock } from './adapter'

const scenario = {
  title: 'Reservation/ Booking',
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

  it('carries the per-language audio paths and the audio button label', () => {
    const props = adaptDemoSimulatorBlock({
      audioLabel: 'Listen a Demo',
      scenarios: [{ ...scenario, audioEn: '/audio/a-en.wav', audioJa: '/audio/a-jp.wav' }],
    })

    expect(props.audioLabel).toBe('Listen a Demo')
    expect(props.scenarios[0]?.audioEn).toBe('/audio/a-en.wav')
    expect(props.scenarios[0]?.audioJa).toBe('/audio/a-jp.wav')
  })

  it('carries the popup video and accepts only https demo-call links', () => {
    const props = adaptDemoSimulatorBlock({
      callLabel: 'Demo Call',
      scenarios: [
        {
          ...scenario,
          videoSrc: '/video/v.mp4',
          callUrlEn: 'https://example.test/en',
          callUrlJa: 'javascript:alert(1)',
        },
      ],
    })

    expect(props.callLabel).toBe('Demo Call')
    expect(props.scenarios[0]?.videoSrc).toBe('/video/v.mp4')
    expect(props.scenarios[0]?.callUrlEn).toBe('https://example.test/en')
    expect(props.scenarios[0]?.callUrlJa).toBe('')
  })

  it('defaults audio paths to empty when a scenario has no recording', () => {
    const props = adaptDemoSimulatorBlock({ scenarios: [scenario] })

    expect(props.scenarios[0]?.audioEn).toBe('')
    expect(props.scenarios[0]?.audioJa).toBe('')
  })

  it('drops scenarios that have no title or no transcript', () => {
    const props = adaptDemoSimulatorBlock({
      scenarios: [scenario, { ...scenario, title: '' }, { ...scenario, turns: [] }],
    })

    expect(props.scenarios).toHaveLength(1)
  })

  it('keeps a titled scenario that has a video but no transcript, and still drops one with neither', () => {
    const props = adaptDemoSimulatorBlock({
      scenarios: [
        { ...scenario, turns: [], videoSrc: '/video/v.mp4' },
        { ...scenario, turns: [] },
      ],
    })

    expect(props.scenarios).toHaveLength(1)
    expect(props.scenarios[0]?.videoSrc).toBe('/video/v.mp4')
    expect(props.scenarios[0]?.turns).toEqual([])
  })

  it('keeps a titled scenario that has recordings but no transcript and no video', () => {
    const props = adaptDemoSimulatorBlock({
      scenarios: [{ ...scenario, turns: [], audioEn: '/audio/a-en.wav', audioJa: '/audio/a-ja.wav' }],
    })

    expect(props.scenarios).toHaveLength(1)
    expect(props.scenarios[0]?.videoSrc).toBe('')
    expect(props.scenarios[0]?.audioJa).toBe('/audio/a-ja.wav')
  })

  it('treats any unknown speaker as the caller and defaults the privacy link', () => {
    const props = adaptDemoSimulatorBlock({
      scenarios: [{ ...scenario, turns: [{ speaker: 'robot', text: 'Hi' }] }],
    })

    expect(props.scenarios[0]?.turns[0]?.speaker).toBe('caller')
    expect(props.privacyHref).toBe('/privacy')
  })
})
