import { describe, expect, it } from 'vitest'
import { advance, getInteraction, start } from '@techmirai/reception-engine'
import type { ChoiceOption, TextResolver, TriageResolver } from '@techmirai/reception-engine'
import { buildStaticFaqAnswers } from './faq-answers'
import {
  buildFaqMenuOptions,
  clinicReceptionFlow,
  FAQ_STAFF_LINK_NODE_ID,
  FAQ_STAFF_OPTION_VALUE,
  RECEPTION_AI_ANSWER_KEY,
} from './flow'

const resolve: TextResolver = (key, locale) => `${key}|${locale}`

function allNodeIds(): string[] {
  return Object.keys(clinicReceptionFlow.nodes)
}

function nextTargetsOf(node: (typeof clinicReceptionFlow.nodes)[string]): string[] {
  switch (node.type) {
    case 'message':
    case 'capture':
    case 'handoff':
      return [node.next]
    case 'choice':
      return node.options.map((o) => o.next)
    case 'faq':
    case 'refusal':
    case 'ai-fallback':
      return [node.backTo]
    case 'input':
      return [node.next]
    case 'triage':
      return [node.refuseTo, ...node.allow, node.aiFallback]
    case 'component':
    case 'link':
    case 'end':
      return []
  }
}

describe('clinicReceptionFlow — graph shape', () => {
  it('every next/backTo target references a node that exists in the graph', () => {
    const ids = new Set(allNodeIds())
    for (const node of Object.values(clinicReceptionFlow.nodes)) {
      for (const target of nextTargetsOf(node)) {
        expect(ids.has(target), `${node.id} points at missing node "${target}"`).toBe(true)
      }
    }
  })

  it('every node is reachable from start by following next/backTo edges', () => {
    const seen = new Set<string>()
    const queue = [clinicReceptionFlow.start]
    while (queue.length > 0) {
      const id = queue.pop()!
      if (seen.has(id)) continue
      seen.add(id)
      const node = clinicReceptionFlow.nodes[id]
      if (!node) continue
      queue.push(...nextTargetsOf(node))
    }
    expect(seen).toEqual(new Set(allNodeIds()))
  })

  it('accepts free text at exactly one node, reachable only from the faq menu', () => {
    const inputNodes = Object.values(clinicReceptionFlow.nodes).filter((n) => n.type === 'input')
    expect(inputNodes.map((n) => n.id)).toEqual(['faq.ask'])

    const inbound = Object.values(clinicReceptionFlow.nodes).filter((n) => nextTargetsOf(n).includes('faq.ask'))
    expect(inbound.map((n) => n.id)).toEqual(['faq.menu'])
  })

  it('sends every free-text submission through triage before anything can answer it', () => {
    const askNode = clinicReceptionFlow.nodes['faq.ask']
    expect(askNode?.type).toBe('input')
    if (askNode?.type !== 'input') throw new Error('expected faq.ask to be an input node')

    expect(askNode.next).toBe('faq.ask.triage')
    expect(askNode.validate).toBe('required') // a blank question never reaches triage
    expect(clinicReceptionFlow.nodes['faq.ask.triage']?.type).toBe('triage')
  })

  it('every faq node answerKey is namespaced faq.*, and every one has a real static answer, in both locales', () => {
    const faqNodes = Object.values(clinicReceptionFlow.nodes).filter((n) => n.type === 'faq')
    expect(faqNodes).toHaveLength(6)

    const enAnswers = buildStaticFaqAnswers('en')
    const jaAnswers = buildStaticFaqAnswers('ja')
    for (const node of faqNodes) {
      expect(node.answerKey.startsWith('faq.')).toBe(true)
      // Not the "please call us" fallback — buildStaticFaqAnswers (sourced
      // from faq-content.ts) actually has this key, in both locales. This
      // is the property that used to fail before the buttons were wired to
      // real content — see the delivery report.
      expect(enAnswers[node.answerKey]).toBeTruthy()
      expect(jaAnswers[node.answerKey]).toBeTruthy()
    }
  })
})

describe('clinicReceptionFlow — menu handoffs', () => {
  function atMenu() {
    return start(clinicReceptionFlow, 'ja', resolve).state
  }

  it('routes 予約したい to the booking component mount', () => {
    const { state } = advance(clinicReceptionFlow, atMenu(), 'book', 'ja', resolve)
    expect(state.currentNodeId).toBe('booking.mount')
  })

  it('routes 予約の変更・キャンセル to the manage link', () => {
    const { state } = advance(clinicReceptionFlow, atMenu(), 'manage', 'ja', resolve)
    expect(state.currentNodeId).toBe('manage.link')
  })

  it('routes 質問がある to the faq menu', () => {
    const { state } = advance(clinicReceptionFlow, atMenu(), 'faq', 'ja', resolve)
    expect(state.currentNodeId).toBe('faq.menu')
  })
})

describe('clinicReceptionFlow — free-text triage (safety-critical)', () => {
  const triageNode = clinicReceptionFlow.nodes['faq.ask.triage']

  function atFreeTextInput(locale: 'ja' | 'en' = 'ja', triage?: TriageResolver) {
    const { state: started } = start(clinicReceptionFlow, locale, resolve, triage)
    const { state: atFaqMenu } = advance(clinicReceptionFlow, started, 'faq', locale, resolve, triage)
    const { state } = advance(clinicReceptionFlow, atFaqMenu, 'ask', locale, resolve, triage)
    return state
  }

  it('routes the faq menu\'s "ask something else" option to the free-text input node', () => {
    const faqMenuNode = clinicReceptionFlow.nodes['faq.menu']
    if (faqMenuNode?.type !== 'choice') throw new Error('expected faq.menu to be a choice node')

    const askOptions = faqMenuNode.options.filter((o) => o.next === 'faq.ask')
    expect(askOptions).toHaveLength(1)
    expect(askOptions[0]?.value).toBe('ask')

    expect(atFreeTextInput().currentNodeId).toBe('faq.ask')
  })

  it('can only route free text to the refusal node, a clinic faq answer, or the ai fallback', () => {
    expect(triageNode?.type).toBe('triage')
    if (triageNode?.type !== 'triage') throw new Error('expected faq.ask.triage to be a triage node')

    expect(triageNode.refuseTo).toBe('refusal.medical')
    expect(triageNode.aiFallback).toBe('faq.ai')
    expect([...triageNode.allow].sort()).toEqual(
      Object.values(clinicReceptionFlow.nodes)
        .filter((n) => n.type === 'faq')
        .map((n) => n.id)
        .sort(),
    )
  })

  it('keeps the refusal node in front of free text — a refused question never reaches the ai node', () => {
    for (const locale of ['ja', 'en'] as const) {
      const triage: TriageResolver = () => ({ kind: 'refuse' })
      const { state, messages } = advance(
        clinicReceptionFlow,
        atFreeTextInput(locale, triage),
        '肩が痛いのですが施術できますか',
        locale,
        resolve,
        triage,
      )

      expect(state.history).toContain('refusal.medical')
      expect(state.history).not.toContain('faq.ai')
      expect(messages.some((m) => m.text.startsWith('reception.refusal.text'))).toBe(true)
      expect(state.currentNodeId).toBe('faq.menu')
    }
  })

  it('refuses rather than follows a match outside the triage allow list', () => {
    const triage: TriageResolver = () => ({ kind: 'static', nodeId: 'booking.mount' })
    const { state } = advance(clinicReceptionFlow, atFreeTextInput('ja', triage), 'anything', 'ja', resolve, triage)

    expect(state.history).toContain('refusal.medical')
    expect(state.history).not.toContain('booking.mount')
  })

  it('answers from the existing faq nodes when a static match is found', () => {
    const triage: TriageResolver = () => ({ kind: 'static', nodeId: 'faq.parking' })
    const { state, messages } = advance(clinicReceptionFlow, atFreeTextInput('ja', triage), '駐車場はありますか', 'ja', resolve, triage)

    expect(messages.some((m) => m.text.startsWith('faq.clinic-parking'))).toBe(true)
    expect(state.history).not.toContain('faq.ai')
    expect(state.currentNodeId).toBe('faq.menu')
  })
})

describe('clinicReceptionFlow — ai fallback (one answer, then stop)', () => {
  const aiNode = clinicReceptionFlow.nodes['faq.ai']

  function askFreeText(locale: 'ja' | 'en' = 'ja', text = 'クレジットカードは使えますか') {
    const { state: started } = start(clinicReceptionFlow, locale, resolve)
    const { state: atFaqMenu } = advance(clinicReceptionFlow, started, 'faq', locale, resolve)
    const { state: atInput } = advance(clinicReceptionFlow, atFaqMenu, 'ask', locale, resolve)
    return advance(clinicReceptionFlow, atInput, text, locale, resolve)
  }

  it('is reached when no static match is found, in both ja and en', () => {
    for (const locale of ['ja', 'en'] as const) {
      const { state, messages } = askFreeText(locale)
      expect(state.history).toContain('faq.ai')
      expect(messages.some((m) => m.text.startsWith(RECEPTION_AI_ANSWER_KEY))).toBe(true)
    }
  })

  it('cannot loop back into itself — its only edge is backTo, pointing at the faq menu', () => {
    expect(aiNode?.type).toBe('ai-fallback')
    if (aiNode?.type !== 'ai-fallback') throw new Error('expected faq.ai to be an ai-fallback node')

    expect(aiNode.backTo).toBe('faq.menu')
    expect(aiNode.backTo).not.toBe(aiNode.id)
    expect(nextTargetsOf(aiNode)).toEqual(['faq.menu'])
    expect(nextTargetsOf(aiNode)).not.toContain('faq.ai')
  })

  it('is unreachable except through triage — nothing else in the graph points at it', () => {
    const inbound = Object.values(clinicReceptionFlow.nodes).filter((n) => nextTargetsOf(n).includes('faq.ai'))
    expect(inbound.map((n) => n.id)).toEqual(['faq.ask.triage'])
  })

  it('answers exactly once and lands back on the menu awaiting a button, not more free text', () => {
    const { state, messages } = askFreeText()
    expect(messages.filter((m) => m.text.startsWith(RECEPTION_AI_ANSWER_KEY))).toHaveLength(1)
    expect(state.currentNodeId).toBe('faq.menu')
    expect(getInteraction(state, clinicReceptionFlow, 'ja', resolve).kind).toBe('choice')
  })

  it('reuses suppressNextPrompt — the faq menu prompt is not replayed after the answer', () => {
    const { messages } = askFreeText()
    expect(messages.filter((m) => m.text.startsWith('reception.faq.menu.prompt'))).toHaveLength(0)
  })
})

describe('clinicReceptionFlow — refusal path (safety-critical)', () => {
  function atFaqMenu(locale: 'ja' | 'en' = 'ja') {
    const { state: started } = start(clinicReceptionFlow, locale, resolve)
    const { state } = advance(clinicReceptionFlow, started, 'faq', locale, resolve)
    return state
  }

  it('deterministically reaches the refusal node from a fixed "other question" option', () => {
    const { state } = advance(clinicReceptionFlow, atFaqMenu(), 'other', 'ja', resolve)
    expect(state.history).toContain('refusal.medical')
  })

  it('produces the fixed refusal message, in both ja and en, and returns to the faq menu', () => {
    for (const locale of ['ja', 'en'] as const) {
      const { state, messages } = advance(clinicReceptionFlow, atFaqMenu(locale), 'other', locale, resolve)
      expect(messages.some((m) => m.text.startsWith('reception.refusal.text'))).toBe(true)
      expect(state.currentNodeId).toBe('faq.menu')
    }
  })

  it('reaches the same refusal node regardless of which faq submenu option preceded it', () => {
    const viaHours = advance(
      clinicReceptionFlow,
      advance(clinicReceptionFlow, atFaqMenu(), 'hours', 'ja', resolve).state,
      'other',
      'ja',
      resolve,
    )
    const direct = advance(clinicReceptionFlow, atFaqMenu(), 'other', 'ja', resolve)

    expect(viaHours.state.currentNodeId).toBe(direct.state.currentNodeId)
    expect(viaHours.messages.some((m) => m.text.startsWith('reception.refusal.text'))).toBe(true)
  })

  it('is the only path reachable from the faq menu\'s "other" option — no other option leads there', () => {
    const faqMenuNode = clinicReceptionFlow.nodes['faq.menu']
    expect(faqMenuNode?.type).toBe('choice')
    if (faqMenuNode?.type !== 'choice') throw new Error('expected faq.menu to be a choice node')

    const routesToRefusal = faqMenuNode.options.filter((o) => o.next === 'refusal.medical')
    expect(routesToRefusal).toHaveLength(1)
    expect(routesToRefusal[0]?.value).toBe('other')
  })
})

describe('clinicReceptionFlow — talk to staff link (part 5)', () => {
  it('is a link node, not a lead-capturing one — no capture/handoff effect anywhere in the graph', () => {
    const node = clinicReceptionFlow.nodes[FAQ_STAFF_LINK_NODE_ID]
    expect(node?.type).toBe('link')
    expect(Object.values(clinicReceptionFlow.nodes).some((n) => n.type === 'capture' || n.type === 'handoff')).toBe(false)
  })

  it('is reachable directly from a dedicated faq.menu option', () => {
    const faqMenuNode = clinicReceptionFlow.nodes['faq.menu']
    if (faqMenuNode?.type !== 'choice') throw new Error('expected faq.menu to be a choice node')

    const staffOptions = faqMenuNode.options.filter((o) => o.next === FAQ_STAFF_LINK_NODE_ID)
    expect(staffOptions).toHaveLength(1)
    expect(staffOptions[0]?.value).toBe(FAQ_STAFF_OPTION_VALUE)
  })

  it('advances from faq.menu to the staff link node when that option is chosen', () => {
    const { state: started } = start(clinicReceptionFlow, 'ja', resolve)
    const { state: atFaqMenu } = advance(clinicReceptionFlow, started, 'faq', 'ja', resolve)
    const { state } = advance(clinicReceptionFlow, atFaqMenu, FAQ_STAFF_OPTION_VALUE, 'ja', resolve)

    expect(state.currentNodeId).toBe(FAQ_STAFF_LINK_NODE_ID)
    expect(getInteraction(state, clinicReceptionFlow, 'ja', resolve).kind).toBe('link')
  })

  it('is reachable via the backTo loop after an AI answer and after a medical refusal, since both return to faq.menu which now offers it', () => {
    const aiNode = clinicReceptionFlow.nodes['faq.ai']
    const refusalNode = clinicReceptionFlow.nodes['refusal.medical']
    if (aiNode?.type !== 'ai-fallback') throw new Error('expected faq.ai to be an ai-fallback node')
    if (refusalNode?.type !== 'refusal') throw new Error('expected refusal.medical to be a refusal node')

    expect(aiNode.backTo).toBe('faq.menu')
    expect(refusalNode.backTo).toBe('faq.menu')

    // Confirmed reachable in practice: land on faq.menu via each backTo path,
    // then take the staff option from there.
    const { state: started } = start(clinicReceptionFlow, 'ja', resolve)
    const { state: atFaqMenu } = advance(clinicReceptionFlow, started, 'faq', 'ja', resolve)

    const { state: afterAi } = advance(clinicReceptionFlow, atFaqMenu, 'prices', 'ja', resolve)
    expect(afterAi.currentNodeId).toBe('faq.menu')
    expect(advance(clinicReceptionFlow, afterAi, FAQ_STAFF_OPTION_VALUE, 'ja', resolve).state.currentNodeId).toBe(
      FAQ_STAFF_LINK_NODE_ID,
    )

    const { state: afterRefusal } = advance(clinicReceptionFlow, atFaqMenu, 'other', 'ja', resolve)
    expect(afterRefusal.currentNodeId).toBe('faq.menu')
    expect(advance(clinicReceptionFlow, afterRefusal, FAQ_STAFF_OPTION_VALUE, 'ja', resolve).state.currentNodeId).toBe(
      FAQ_STAFF_LINK_NODE_ID,
    )
  })
})

describe('clinicReceptionFlow — faq.menu ordering ("Type your own question" always last)', () => {
  it('is the last option in the live flow graph today', () => {
    const faqMenuNode = clinicReceptionFlow.nodes['faq.menu']
    if (faqMenuNode?.type !== 'choice') throw new Error('expected faq.menu to be a choice node')

    expect(faqMenuNode.options.at(-1)?.value).toBe('ask')
  })

  it('buildFaqMenuOptions places "ask" last regardless of how many other options are passed in — not reliant on array-definition order', () => {
    const askOption: ChoiceOption = { labelKey: 'reception.faq.opt.ask', value: 'ask', next: 'faq.ask' }
    const dummy = (n: number): ChoiceOption => ({ labelKey: `dummy.${n}`, value: `dummy-${n}`, next: 'faq.menu' })

    // Zero other options.
    expect(buildFaqMenuOptions([])).toEqual([askOption])

    // Today's real nine.
    const faqMenuNode = clinicReceptionFlow.nodes['faq.menu']
    if (faqMenuNode?.type !== 'choice') throw new Error('expected faq.menu to be a choice node')
    const realOtherOptions = faqMenuNode.options.filter((o) => o.value !== 'ask')
    expect(buildFaqMenuOptions(realOtherOptions).at(-1)).toEqual(askOption)

    // One more than today, and far more than today — a future menu growing
    // (or shrinking) never has to remember to keep "ask" positioned last.
    expect(buildFaqMenuOptions([...realOtherOptions, dummy(1)]).at(-1)).toEqual(askOption)
    expect(buildFaqMenuOptions([dummy(1), dummy(2), dummy(3), dummy(4), dummy(5), dummy(6), dummy(7)]).at(-1)).toEqual(askOption)

    // Removing options — down to just one — "ask" still ends up last.
    expect(buildFaqMenuOptions([realOtherOptions[0]!]).at(-1)).toEqual(askOption)
  })
})
