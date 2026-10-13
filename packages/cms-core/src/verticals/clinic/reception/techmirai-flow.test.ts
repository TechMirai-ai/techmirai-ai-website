import { advance, getInteraction, goTo, start } from '@techmirai/reception-engine'
import type { EngineState, Interaction } from '@techmirai/reception-engine'
import { describe, expect, it } from 'vitest'
import { createReceptionTextResolver } from './resolver'
import { buildTechmiraiMessages, MATCHED_ENTRIES } from './techmirai-chat-content'
import { techmiraiReceptionFlow as flow } from './techmirai-flow'
import { createTechmiraiTriageResolver } from './techmirai-triage'

function harness(locale: 'en' | 'ja') {
  const resolve = createReceptionTextResolver({
    messages: { [locale]: { reception: buildTechmiraiMessages(locale) } },
    faqAnswers: {},
    phone: '',
  })
  const triage = createTechmiraiTriageResolver(locale)
  let session = start(flow, locale, resolve, triage)
  const texts = () => session.messages.map((m) => m.text)
  const interaction = (): Interaction => getInteraction(session.state, flow, locale, resolve)
  const choose = (value: string) => {
    const next = advance(flow, session.state, value, locale, resolve, triage)
    session = { state: next.state, messages: [...session.messages, ...next.messages] }
  }
  const jump = (nodeId: string, data?: Record<string, string>) => {
    const from: EngineState = data ? { ...session.state, data: { ...session.state.data, ...data } } : session.state
    const next = goTo(flow, from, nodeId, locale, resolve, triage)
    session = { state: next.state, messages: [...session.messages, ...next.messages] }
  }
  const labels = () => {
    const i = interaction()
    return i.kind === 'choice' ? i.options.map((o) => o.label) : []
  }
  return { texts, interaction, choose, jump, labels, state: () => session.state }
}

describe('techmiraiReceptionFlow structure', () => {
  it('starts on the greeting with the six menu buttons in Spec order', () => {
    const h = harness('en')
    expect(h.texts()).toHaveLength(1)
    expect(h.labels()).toEqual([
      'What is AI受付?',
      'See the live demo',
      'Pricing',
      'Examples by industry',
      'Free assessment or consultation',
      'Talk to a person',
    ])
  })

  it('never points a button at a node that does not exist', () => {
    for (const node of Object.values(flow.nodes)) {
      if (node.type !== 'choice') continue
      for (const option of node.options) {
        expect(flow.nodes[option.next], `${node.id} -> ${option.value}`).toBeDefined()
      }
    }
  })

  it('keeps a link button on its own node and gives it an href', () => {
    for (const node of Object.values(flow.nodes)) {
      if (node.type !== 'choice') continue
      for (const option of node.options.filter((o) => o.href)) {
        expect(option.next, `${node.id} ${option.value}`).toBe(node.id)
      }
    }
  })

  it('whitelists the 36 matched answers, "Talk to a person" and the rule-13 redirect for triage, and refuses to F09', () => {
    const triage = flow.nodes['triage']
    expect(triage?.type).toBe('triage')
    if (triage?.type !== 'triage') return
    expect([...triage.allow].sort()).toEqual([...MATCHED_ENTRIES.map((e) => e.id), 'b6', 'off-topic'].sort())
    expect(triage.allow).toContain(triage.refuseTo)
    expect(triage.aiFallback).toBe('ai')
  })

  it('ends the AI path at "Talk to a person"', () => {
    const ai = flow.nodes['ai']
    expect(ai?.type === 'ai-fallback' && ai.backTo).toBe('b6')
  })
})

describe('techmiraiReceptionFlow behaviour (engine + resolver, both languages)', () => {
  it.each(['en', 'ja'] as const)('B1 -> B1a -> Menu works in %s', (locale) => {
    const h = harness(locale)
    h.choose('b1')
    h.choose('b1a')
    h.choose('c01')
    expect(h.state().currentNodeId).toBe('c01')
    expect(h.labels()).toHaveLength(6)
  })

  it('"Book a call" mounts the inline booking component', () => {
    const h = harness('en')
    h.choose('b5')
    h.choose('booking-1')
    expect(h.interaction()).toEqual({ kind: 'component', componentId: 'booking' })
  })

  it('"Request a voice demo" (B1b) and "Book a demo walkthrough" (B2) also open the inline booking', () => {
    const voice = harness('en')
    voice.choose('b1')
    voice.choose('b1b')
    voice.choose('booking-0')
    expect(voice.interaction()).toEqual({ kind: 'component', componentId: 'booking' })

    const demo = harness('en')
    demo.choose('b2')
    demo.choose('booking-1')
    expect(demo.interaction()).toEqual({ kind: 'component', componentId: 'booking' })
  })

  it('"Send my website" is a link to /assessment on the B5 node', () => {
    const h = harness('en')
    h.choose('b5')
    const i = h.interaction()
    expect(i.kind === 'choice' && i.options.find((o) => o.label === 'Send my website')?.href).toBe('/assessment')
  })

  it('B2 "Open the demo" is a new-tab host link; B6 offers LINE, Call and the email form', () => {
    const demo = harness('en')
    demo.choose('b2')
    const di = demo.interaction()
    expect(di.kind === 'choice' && di.options.find((o) => o.label === 'Open the demo')).toMatchObject({ href: '@demo', newTab: true })

    const person = harness('en')
    person.choose('b6')
    expect(person.labels()).toEqual(['LINE', 'Call', 'Email form'])
  })

  it.each(['en', 'ja'] as const)('every one of the 36 matched answers renders its own text in %s', (locale) => {
    for (const entry of MATCHED_ENTRIES) {
      const h = harness(locale)
      h.jump(entry.id)
      expect(h.texts().at(-1), `${entry.code} ${locale}`).toBe(entry.answer[locale])
    }
  })

  it('a typed question jumps to triage, shows the matched answer and its next buttons', () => {
    const h = harness('en')
    h.jump('triage', { question: 'how much does it cost?' })
    expect(h.texts().at(-1)).toContain('Starter Package starts from [¥300,000]')
    expect(h.labels()).toEqual(['Pricing page', 'Free assessment'])
  })

  it('a typed question nothing matches goes to the AI node and then to "Talk to a person"', () => {
    const h = harness('en')
    h.jump('triage', { question: 'Can I bring my dog to a meeting?' })
    expect(h.texts().at(-1)).toContain('I’m not sure about that')
    expect(h.state().currentNodeId).toBe('b6')
  })
})
