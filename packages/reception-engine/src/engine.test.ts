import { describe, expect, it, vi } from 'vitest'
import { advance, createInitialState, getInteraction, start } from './engine'
import type { FlowGraph, TextResolver, TriageResolver } from './types'

/** Identity-ish resolver: lets assertions read back exactly what the engine asked for. */
function makeResolve(): TextResolver {
  return vi.fn((key: string, locale: string) => `${key}|${locale}`)
}

const flow: FlowGraph = {
  id: 'test.flow',
  start: 'greeting',
  nodes: {
    greeting: { id: 'greeting', type: 'message', textKey: 'greeting', next: 'menu' },
    menu: {
      id: 'menu',
      type: 'choice',
      promptKey: 'menu.prompt',
      options: [
        { labelKey: 'menu.faq', value: 'faq', next: 'faq.menu' },
        { labelKey: 'menu.book', value: 'book', next: 'booking.mount', set: { intent: 'book' }, setTarget: 'booking' },
        { labelKey: 'menu.manage', value: 'manage', next: 'manage.link' },
        { labelKey: 'menu.capture', value: 'capture', next: 'do.capture' },
      ],
    },
    'faq.menu': {
      id: 'faq.menu',
      type: 'choice',
      promptKey: 'faq.menu.prompt',
      options: [
        { labelKey: 'faq.opt.hours', value: 'hours', next: 'faq.hours' },
        { labelKey: 'faq.opt.ask', value: 'ask', next: 'ask.free' },
        { labelKey: 'faq.opt.other', value: 'other', next: 'refusal.medical' },
        { labelKey: 'faq.opt.back', value: 'back', next: 'menu' },
      ],
    },
    'faq.hours': { id: 'faq.hours', type: 'faq', answerKey: 'faq.hours.answer', backTo: 'faq.menu' },
    'refusal.medical': { id: 'refusal.medical', type: 'refusal', textKey: 'refusal.text', backTo: 'faq.menu' },
    'ask.free': {
      id: 'ask.free',
      type: 'input',
      promptKey: 'ask.free.prompt',
      field: 'question',
      inputType: 'text',
      validate: 'required',
      next: 'ask.triage',
    },
    'ask.triage': {
      id: 'ask.triage',
      type: 'triage',
      field: 'question',
      refuseTo: 'refusal.medical',
      allow: ['faq.hours'],
      aiFallback: 'ai.answer',
    },
    'ai.answer': { id: 'ai.answer', type: 'ai-fallback', field: 'question', textKey: 'ai.text', backTo: 'faq.menu' },
    'booking.mount': { id: 'booking.mount', type: 'component', componentId: 'booking', textKey: 'booking.intro' },
    'booking.mount.silent': { id: 'booking.mount.silent', type: 'component', componentId: 'booking' },
    'manage.link': { id: 'manage.link', type: 'link', textKey: 'manage.intro', href: '/booking/manage', labelKey: 'manage.cta' },
    'do.capture': { id: 'do.capture', type: 'capture', target: 'lead', next: 'ask.name' },
    'ask.name': {
      id: 'ask.name',
      type: 'input',
      promptKey: 'ask.name.prompt',
      field: 'name',
      inputType: 'text',
      validate: 'required',
      next: 'ask.email',
    },
    'ask.email': {
      id: 'ask.email',
      type: 'input',
      promptKey: 'ask.email.prompt',
      field: 'email',
      inputType: 'email',
      validate: 'email',
      next: 'ask.phone',
    },
    'ask.phone': {
      id: 'ask.phone',
      type: 'input',
      promptKey: 'ask.phone.prompt',
      field: 'phone',
      inputType: 'phone',
      validate: 'phone',
      next: 'ask.notes',
    },
    'ask.notes': {
      id: 'ask.notes',
      type: 'input',
      promptKey: 'ask.notes.prompt',
      field: 'notes',
      inputType: 'textarea',
      optional: true,
      next: 'ask.plan',
    },
    'ask.plan': {
      id: 'ask.plan',
      type: 'input',
      promptKey: 'ask.plan.prompt',
      field: 'plan',
      inputType: 'select',
      options: [{ labelKey: 'plan.basic', value: 'basic' }],
      next: 'end',
    },
    end: { id: 'end', type: 'end', textKey: 'end.text' },
  },
}

describe('createInitialState', () => {
  it('starts on the flow start node with empty data and active status', () => {
    const state = createInitialState(flow)
    expect(state.currentNodeId).toBe('greeting')
    expect(state.status).toBe('active')
    expect(state.data).toEqual({})
    expect(state.history).toEqual([])
    expect(state.effects).toEqual([])
  })
})

describe('start', () => {
  it('walks forward through message nodes and halts at a choice, pushing its prompt', () => {
    const resolve = makeResolve()
    const { state, messages } = start(flow, 'ja', resolve)

    expect(messages.map((m) => m.text)).toEqual(['greeting|ja', 'menu.prompt|ja'])
    expect(state.currentNodeId).toBe('menu')
    expect(state.status).toBe('active')
  })
})

describe('advance > choice', () => {
  it('rejects an unknown option value, keeping position and setting an error', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state, messages } = advance(flow, started, 'not-a-real-option', 'en', resolve)

    expect(state.currentNodeId).toBe('menu')
    expect(state.error).toBe('system.invalidChoice|en')
    expect(messages).toEqual([])
  })

  it('applies set/setTarget from the chosen option and advances', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state } = advance(flow, started, 'book', 'en', resolve)

    expect(state.data.intent).toBe('book')
    expect(state.target).toBe('booking')
    expect(state.currentNodeId).toBe('booking.mount')
  })

  it('clears the previous error and effects on a fresh advance call', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state: errored } = advance(flow, started, 'nope', 'en', resolve)
    expect(errored.error).not.toBeNull()

    const { state: recovered } = advance(flow, errored, 'faq', 'en', resolve)
    expect(recovered.error).toBeNull()
  })
})

describe('advance > input', () => {
  function reachCaptureFlow() {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state: afterMenu } = advance(flow, started, 'capture', 'en', resolve)
    return { resolve, afterMenu }
  }

  it('emits a capture side effect and continues to the first input node', () => {
    const { afterMenu } = reachCaptureFlow()
    expect(afterMenu.effects).toEqual([{ type: 'capture', target: 'lead' }])
    expect(afterMenu.currentNodeId).toBe('ask.name')
  })

  it('rejects empty input against the required validator', () => {
    const { resolve, afterMenu } = reachCaptureFlow()
    const { state } = advance(flow, afterMenu, '', 'en', resolve)
    expect(state.currentNodeId).toBe('ask.name')
    expect(state.error).toBe('system.invalid.required|en')
  })

  it('accepts valid required input and records it under the field name', () => {
    const { resolve, afterMenu } = reachCaptureFlow()
    const { state } = advance(flow, afterMenu, 'Yamada Taro', 'en', resolve)
    expect(state.data.name).toBe('Yamada Taro')
    expect(state.currentNodeId).toBe('ask.email')
  })

  it('rejects a malformed email against the email validator', () => {
    const { resolve, afterMenu } = reachCaptureFlow()
    const { state: afterName } = advance(flow, afterMenu, 'Yamada Taro', 'en', resolve)
    const { state } = advance(flow, afterName, 'not-an-email', 'en', resolve)
    expect(state.currentNodeId).toBe('ask.email')
    expect(state.error).toBe('system.invalid.email|en')
  })

  it('rejects a malformed phone number against the phone validator', () => {
    const { resolve, afterMenu } = reachCaptureFlow()
    const { state: afterName } = advance(flow, afterMenu, 'Yamada Taro', 'en', resolve)
    const { state: afterEmail } = advance(flow, afterName, 'a@b.com', 'en', resolve)
    const { state } = advance(flow, afterEmail, 'not-a-phone!!', 'en', resolve)
    expect(state.currentNodeId).toBe('ask.phone')
    expect(state.error).toBe('system.invalid.phone|en')
  })

  it('skips an optional field without recording it when submitted empty', () => {
    const { resolve, afterMenu } = reachCaptureFlow()
    const { state: afterName } = advance(flow, afterMenu, 'Yamada Taro', 'en', resolve)
    const { state: afterEmail } = advance(flow, afterName, 'a@b.com', 'en', resolve)
    const { state: afterPhone } = advance(flow, afterEmail, '+81-90-1234-5678', 'en', resolve)
    const { state } = advance(flow, afterPhone, '', 'en', resolve)

    expect(state.data.notes).toBeUndefined()
    expect(state.currentNodeId).toBe('ask.plan')
  })

  it('rejects a select value outside its declared options', () => {
    const { resolve, afterMenu } = reachCaptureFlow()
    const { state: afterName } = advance(flow, afterMenu, 'Yamada Taro', 'en', resolve)
    const { state: afterEmail } = advance(flow, afterName, 'a@b.com', 'en', resolve)
    const { state: afterPhone } = advance(flow, afterEmail, '+81-90-1234-5678', 'en', resolve)
    const { state: afterNotes } = advance(flow, afterPhone, '', 'en', resolve)
    const { state } = advance(flow, afterNotes, 'not-a-plan', 'en', resolve)

    expect(state.currentNodeId).toBe('ask.plan')
    expect(state.error).toBe('system.invalidChoice|en')
  })

  it('reaches the end node once every required field is satisfied', () => {
    const { resolve, afterMenu } = reachCaptureFlow()
    const { state: afterName } = advance(flow, afterMenu, 'Yamada Taro', 'en', resolve)
    const { state: afterEmail } = advance(flow, afterName, 'a@b.com', 'en', resolve)
    const { state: afterPhone } = advance(flow, afterEmail, '+81-90-1234-5678', 'en', resolve)
    const { state: afterNotes } = advance(flow, afterPhone, '', 'en', resolve)
    const { state } = advance(flow, afterNotes, 'basic', 'en', resolve)

    expect(state.data.plan).toBe('basic')
    expect(state.currentNodeId).toBeNull()
    expect(state.status).toBe('done')
  })
})

describe('faq nodes', () => {
  it('pushes the resolved answer and returns to backTo', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'ja', resolve)
    const { state: atFaqMenu } = advance(flow, started, 'faq', 'ja', resolve)
    const { state, messages } = advance(flow, atFaqMenu, 'hours', 'ja', resolve)

    expect(messages.some((m) => m.text === 'faq.hours.answer|ja')).toBe(true)
    expect(state.currentNodeId).toBe('faq.menu')
  })

  it('does not replay the menu prompt when returning from an faq (suppressNextPrompt)', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'ja', resolve)
    const { state: atFaqMenu } = advance(flow, started, 'faq', 'ja', resolve)
    const { messages } = advance(flow, atFaqMenu, 'hours', 'ja', resolve)

    expect(messages.filter((m) => m.text === 'faq.menu.prompt|ja')).toHaveLength(0)
  })
})

describe('component nodes', () => {
  it('pushes the lead-in message when textKey is present, then halts', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state, messages } = advance(flow, started, 'book', 'en', resolve)

    expect(messages.some((m) => m.text === 'booking.intro|en')).toBe(true)
    expect(state.currentNodeId).toBe('booking.mount')
    expect(state.status).toBe('active')
  })

  it('pushes no message when textKey is absent', () => {
    const resolve = makeResolve()
    const bareFlow: FlowGraph = { ...flow, start: 'booking.mount.silent' }
    const { messages } = start(bareFlow, 'en', resolve)
    expect(messages).toEqual([])
  })

  it('reports a component interaction with the componentId', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state } = advance(flow, started, 'book', 'en', resolve)

    expect(getInteraction(state, flow, 'en', resolve)).toEqual({ kind: 'component', componentId: 'booking' })
  })
})

describe('link nodes', () => {
  it('pushes the lead-in message and halts', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state, messages } = advance(flow, started, 'manage', 'en', resolve)

    expect(messages.some((m) => m.text === 'manage.intro|en')).toBe(true)
    expect(state.currentNodeId).toBe('manage.link')
  })

  it('reports a link interaction with href and resolved label', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state } = advance(flow, started, 'manage', 'en', resolve)

    expect(getInteraction(state, flow, 'en', resolve)).toEqual({
      kind: 'link',
      href: '/booking/manage',
      label: 'manage.cta|en',
    })
  })
})

describe('refusal nodes — safety invariants', () => {
  it('is reachable via a fixed, predetermined choice option', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'ja', resolve)
    const { state: atFaqMenu } = advance(flow, started, 'faq', 'ja', resolve)
    const { state } = advance(flow, atFaqMenu, 'other', 'ja', resolve)

    expect(state.currentNodeId).toBe('faq.menu') // backTo, after the refusal message
    expect(state.history).toContain('refusal.medical')
  })

  it('behaves exactly like faq: message + backTo + prompt suppression', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'ja', resolve)
    const { state: atFaqMenu } = advance(flow, started, 'faq', 'ja', resolve)
    const { state, messages } = advance(flow, atFaqMenu, 'other', 'ja', resolve)

    expect(messages.some((m) => m.text === 'refusal.text|ja')).toBe(true)
    expect(state.currentNodeId).toBe('faq.menu')
    expect(messages.filter((m) => m.text === 'faq.menu.prompt|ja')).toHaveLength(0)
  })

  it('resolves its text from ONLY (textKey, locale) — never from EngineState.data or history', () => {
    const resolve = makeResolve()

    // Conversation A: reaches refusal with no prior collected data.
    const { state: startedA } = start(flow, 'ja', resolve)
    const { state: faqMenuA } = advance(flow, startedA, 'faq', 'ja', resolve)
    const { messages: messagesA } = advance(flow, faqMenuA, 'other', 'ja', resolve)

    // Conversation B: reaches refusal via the booking branch first (sets data.intent,
    // target, and a longer history) before eventually landing on the same refusal node.
    const { state: startedB } = start(flow, 'ja', resolve)
    const { state: afterBook } = advance(flow, startedB, 'book', 'ja', resolve)
    const pretendBackAtMenu = { ...afterBook, currentNodeId: 'menu' }
    const { state: faqMenuB } = advance(flow, pretendBackAtMenu, 'faq', 'ja', resolve)
    const { messages: messagesB } = advance(flow, faqMenuB, 'other', 'ja', resolve)

    const refusalTextA = messagesA.find((m) => m.text.startsWith('refusal.text'))?.text
    const refusalTextB = messagesB.find((m) => m.text.startsWith('refusal.text'))?.text

    expect(refusalTextA).toBe('refusal.text|ja')
    expect(refusalTextB).toBe('refusal.text|ja')
    expect(refusalTextA).toBe(refusalTextB)
    expect(afterBook.data.intent).toBe('book') // sanity: conversation B really did collect data
  })

  it('always lands on the node-graph-fixed backTo target, regardless of prior navigation history', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state: atFaqMenu } = advance(flow, started, 'faq', 'en', resolve)
    const { state: afterHours } = advance(flow, atFaqMenu, 'hours', 'en', resolve) // faq.hours -> faq.menu first
    const { state } = advance(flow, afterHours, 'other', 'en', resolve)

    expect(state.currentNodeId).toBe('faq.menu')
  })
})

describe('triage nodes — free-text routing', () => {
  /** Free text is only reachable through the faq menu's "ask" option. */
  function atFreeTextInput(locale: 'ja' | 'en' = 'en', triage?: TriageResolver) {
    const resolve = makeResolve()
    const { state: started } = start(flow, locale, resolve, triage)
    const { state: atFaqMenu } = advance(flow, started, 'faq', locale, resolve, triage)
    const { state } = advance(flow, atFaqMenu, 'ask', locale, resolve, triage)
    return { resolve, state }
  }

  it('halts at the input node and prompts for the question', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state: atFaqMenu } = advance(flow, started, 'faq', 'en', resolve)
    const { state, messages } = advance(flow, atFaqMenu, 'ask', 'en', resolve)

    expect(state.currentNodeId).toBe('ask.free')
    expect(messages.some((m) => m.text === 'ask.free.prompt|en')).toBe(true)
  })

  it('records the question under the node field and passes it to the resolver', () => {
    const triage = vi.fn<TriageResolver>(() => ({ kind: 'ai' }))
    const { resolve, state } = atFreeTextInput('ja', triage)
    const { state: answered } = advance(flow, state, 'do you have parking?', 'ja', resolve, triage)

    expect(answered.data.question).toBe('do you have parking?')
    expect(triage).toHaveBeenCalledWith('do you have parking?', 'ja')
  })

  it('falls to the ai fallback when no resolver is injected (build-order stub)', () => {
    const { resolve, state } = atFreeTextInput()
    const { state: answered, messages } = advance(flow, state, 'anything at all', 'en', resolve)

    expect(answered.history).toContain('ai.answer')
    expect(messages.some((m) => m.text === 'ai.text|en')).toBe(true)
  })

  it('routes to a static answer node when the resolver names one inside allow', () => {
    const triage: TriageResolver = () => ({ kind: 'static', nodeId: 'faq.hours' })
    const { resolve, state } = atFreeTextInput('en', triage)
    const { state: answered, messages } = advance(flow, state, 'when do you open?', 'en', resolve, triage)

    expect(answered.history).toContain('faq.hours')
    expect(answered.history).not.toContain('ai.answer')
    expect(messages.some((m) => m.text === 'faq.hours.answer|en')).toBe(true)
  })

  it('routes to the fixed refusal node when the resolver refuses', () => {
    const triage: TriageResolver = () => ({ kind: 'refuse' })
    const { resolve, state } = atFreeTextInput('en', triage)
    const { state: answered, messages } = advance(flow, state, 'my shoulder hurts', 'en', resolve, triage)

    expect(answered.history).toContain('refusal.medical')
    expect(answered.history).not.toContain('ai.answer')
    expect(messages.some((m) => m.text === 'refusal.text|en')).toBe(true)
  })

  it('refuses rather than follows a static nodeId outside the node allow list', () => {
    const triage: TriageResolver = () => ({ kind: 'static', nodeId: 'booking.mount' })
    const { resolve, state } = atFreeTextInput('en', triage)
    const { state: answered } = advance(flow, state, 'take me to booking', 'en', resolve, triage)

    expect(answered.history).toContain('refusal.medical')
    expect(answered.history).not.toContain('booking.mount')
    expect(answered.currentNodeId).toBe('faq.menu')
  })

  it('never lets free text reach a node the triage node does not name', () => {
    const declared = new Set(['refusal.medical', 'faq.hours', 'ai.answer'])
    for (const attempt of ['do.capture', 'manage.link', 'end', 'ask.free'] as const) {
      const triage: TriageResolver = () => ({ kind: 'static', nodeId: attempt })
      const { resolve, state } = atFreeTextInput('en', triage)
      const { state: answered } = advance(flow, state, 'anything', 'en', resolve, triage)
      const visitedAfterTriage = answered.history.slice(answered.history.indexOf('ask.triage') + 1)
      for (const id of visitedAfterTriage) {
        expect(declared.has(id) || id === 'faq.menu').toBe(true)
      }
    }
  })
})

describe('ai-fallback nodes — one answer, then stop', () => {
  function askFreeText(triage?: TriageResolver) {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve, triage)
    const { state: atFaqMenu } = advance(flow, started, 'faq', 'en', resolve, triage)
    const { state: atInput } = advance(flow, atFaqMenu, 'ask', 'en', resolve, triage)
    return { resolve, ...advance(flow, atInput, 'a question', 'en', resolve, triage) }
  }

  it('emits its text once and returns to backTo', () => {
    const { state, messages } = askFreeText()
    expect(messages.filter((m) => m.text === 'ai.text|en')).toHaveLength(1)
    expect(state.currentNodeId).toBe('faq.menu')
  })

  it('reuses suppressNextPrompt: the menu prompt is not replayed', () => {
    const { messages } = askFreeText()
    expect(messages.filter((m) => m.text === 'faq.menu.prompt|en')).toHaveLength(0)
  })

  it('cannot loop back into itself — its only edge is backTo, and backTo is not itself', () => {
    const node = flow.nodes['ai.answer']
    expect(node?.type).toBe('ai-fallback')
    if (node?.type !== 'ai-fallback') throw new Error('expected ai.answer to be an ai-fallback node')

    expect(node.backTo).not.toBe(node.id)
    // The node object carries exactly one edge field; there is no `next`,
    // no self-reference, and nothing else for the engine to follow.
    expect(Object.keys(node).filter((k) => k !== 'id' && k !== 'type' && k !== 'field' && k !== 'textKey')).toEqual([
      'backTo',
    ])
  })

  it('answers once per traversal — a second answer costs another menu choice', () => {
    const { resolve, state } = askFreeText()
    // Landed back on the menu, awaiting a choice — not on the ai node.
    expect(state.currentNodeId).toBe('faq.menu')
    expect(getInteraction(state, flow, 'en', resolve).kind).toBe('choice')
  })
})

describe('end nodes', () => {
  it('sets status done and currentNodeId null', () => {
    const resolve = makeResolve()
    const endOnlyFlow: FlowGraph = { ...flow, start: 'end' }
    const { state } = start(endOnlyFlow, 'en', resolve)
    expect(state.status).toBe('done')
    expect(state.currentNodeId).toBeNull()
  })
})

describe('getInteraction', () => {
  it('returns none once the flow is done', () => {
    const resolve = makeResolve()
    const endOnlyFlow: FlowGraph = { ...flow, start: 'end' }
    const { state } = start(endOnlyFlow, 'en', resolve)
    expect(getInteraction(state, endOnlyFlow, 'en', resolve)).toEqual({ kind: 'none' })
  })

  it('returns choice options with resolved labels', () => {
    const resolve = makeResolve()
    const { state } = start(flow, 'en', resolve)
    const interaction = getInteraction(state, flow, 'en', resolve)
    expect(interaction.kind).toBe('choice')
    if (interaction.kind === 'choice') {
      expect(interaction.options).toContainEqual({ label: 'menu.faq|en', value: 'faq' })
    }
  })

  it('returns input metadata with resolved option labels', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state: afterMenu } = advance(flow, started, 'capture', 'en', resolve)
    const { state: afterName } = advance(flow, afterMenu, 'Yamada Taro', 'en', resolve)
    const { state: afterEmail } = advance(flow, afterName, 'a@b.com', 'en', resolve)
    const { state: afterPhone } = advance(flow, afterEmail, '+81-90-1234-5678', 'en', resolve)
    const { state } = advance(flow, afterPhone, '', 'en', resolve)

    const interaction = getInteraction(state, flow, 'en', resolve)
    expect(interaction.kind).toBe('input')
    if (interaction.kind === 'input') {
      expect(interaction.field).toBe('plan')
      expect(interaction.options).toContainEqual({ label: 'plan.basic|en', value: 'basic' })
    }
  })

  it('resolves the input placeholder from the node promptKey — never a raw key', () => {
    const resolve = makeResolve()
    const { state: started } = start(flow, 'en', resolve)
    const { state: afterMenu } = advance(flow, started, 'capture', 'en', resolve)

    const interaction = getInteraction(afterMenu, flow, 'en', resolve)
    expect(interaction.kind).toBe('input')
    if (interaction.kind === 'input') {
      expect(interaction.placeholder).toBe('ask.name.prompt|en')
    }
  })
})
