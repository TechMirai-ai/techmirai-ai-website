import { describe, expect, it } from 'vitest'
import { advance, createInitialState, getInteraction, goTo, start } from './engine'
import type { FlowGraph } from './types'

// Link options and goTo (docs/ENGINE-FIXES.md, K1): a choice button can be a link
// that never advances the flow, and the host can jump to a named node from anywhere.

const resolve = (key: string) => key

const flow: FlowGraph = {
  id: 'test',
  start: 'a',
  nodes: {
    a: {
      id: 'a',
      type: 'choice',
      promptKey: 'a.prompt',
      options: [
        { labelKey: 'go', value: 'go', next: 'b' },
        { labelKey: 'ext', value: 'link-1', next: 'a', href: 'https://example.test', newTab: true },
        { labelKey: 'int', value: 'link-2', next: 'a', href: '/page' },
      ],
    },
    b: { id: 'b', type: 'choice', promptKey: 'b.prompt', options: [{ labelKey: 'back', value: 'back', next: 'a' }] },
    f: { id: 'f', type: 'faq', answerKey: 'f.answer', backTo: 'b' },
  },
}

describe('getInteraction — link options', () => {
  it('exposes href and newTab on link options only', () => {
    const { state } = start(flow, 'en', resolve)
    const interaction = getInteraction(state, flow, 'en', resolve)

    expect(interaction).toEqual({
      kind: 'choice',
      options: [
        { label: 'go', value: 'go' },
        { label: 'ext', value: 'link-1', href: 'https://example.test', newTab: true },
        { label: 'int', value: 'link-2', href: '/page' },
      ],
    })
  })
})

describe('goTo', () => {
  it('jumps to the named node and shows its prompt', () => {
    const { state } = start(flow, 'en', resolve)
    const result = goTo(flow, state, 'b', 'en', resolve)

    expect(result.state.currentNodeId).toBe('b')
    expect(result.messages.map((m) => m.text)).toEqual(['b.prompt'])
  })

  it('runs forward through auto-advancing nodes to the next choice', () => {
    const { state } = start(flow, 'en', resolve)
    const result = goTo(flow, state, 'f', 'en', resolve)

    expect(result.messages.map((m) => m.text)).toEqual(['f.answer'])
    expect(result.state.currentNodeId).toBe('b')
  })

  it('does not mutate the previous state, and keeps its collected data', () => {
    const initial = createInitialState(flow)
    const prev = { ...initial, data: { question: 'hello' } }
    const result = goTo(flow, prev, 'b', 'en', resolve)

    expect(prev.currentNodeId).toBe('a')
    expect(result.state.data).toEqual({ question: 'hello' })
  })

  it('clears a pending prompt suppression so the target always shows its prompt', () => {
    const initial = createInitialState(flow)
    const result = goTo(flow, { ...initial, suppressNextPrompt: true }, 'b', 'en', resolve)

    expect(result.messages.map((m) => m.text)).toEqual(['b.prompt'])
  })

  it('leaves the state untouched for an unknown node id', () => {
    const { state } = start(flow, 'en', resolve)
    const result = goTo(flow, state, 'missing', 'en', resolve)

    expect(result.state).toBe(state)
    expect(result.messages).toEqual([])
  })

  it('still lets a normal choice advance afterwards', () => {
    const { state } = start(flow, 'en', resolve)
    const jumped = goTo(flow, state, 'b', 'en', resolve)
    const result = advance(flow, jumped.state, 'back', 'en', resolve)

    expect(result.state.currentNodeId).toBe('a')
  })
})
