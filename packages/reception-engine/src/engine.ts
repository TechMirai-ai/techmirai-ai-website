// ─────────────────────────────────────────────────────────────────────────────
// The engine.
//
// Pure, deterministic, framework-agnostic. No fetch, no React, no Payload.
// It walks a FlowGraph, accumulates answers, validates input, and emits the bot
// messages to render. Anything with a side effect (saving a lead, notifying
// staff) is surfaced as a `SideEffect` for the host (the hook) to perform.
// Text is resolved through a host-supplied `TextResolver` — the engine never
// imports an i18n module itself, so the same graph can be driven by static
// copy, CMS-sourced content, or both, without the engine doing any I/O.
//
// Ported from sadiatec-assistant's src/lib/chat-engine/engine.ts. This is the
// reusable core. To support a new flow, you write a new FlowGraph — you never
// edit this file.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ChatMessage,
  EngineState,
  FlowGraph,
  Interaction,
  Locale,
  TextResolver,
  TriageOutcome,
  TriageResolver,
  ValidatorName,
} from './types'

let counter = 0
const mid = () => `m_${Date.now().toString(36)}_${(counter++).toString(36)}`

const validators: Record<ValidatorName, (v: string) => boolean> = {
  required: (v) => v.trim().length > 0,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  phone: (v) => /^[+]?[\d\s()-]{6,}$/.test(v.trim()),
}

export function createInitialState(flow: FlowGraph): EngineState {
  return {
    flowId: flow.id,
    ...(flow.target !== undefined ? { target: flow.target } : {}),
    currentNodeId: flow.start,
    history: [],
    data: {},
    status: 'active',
    error: null,
    effects: [],
  }
}

/**
 * Walk forward through auto-advancing nodes (message / faq / refusal / capture /
 * triage / ai-fallback), collecting bot messages, until we reach a node that
 * needs the user (choice / input / component / link) or the end of the flow.
 */
function runForward(
  flow: FlowGraph,
  state: EngineState,
  locale: Locale,
  resolve: TextResolver,
  triage?: TriageResolver,
): { state: EngineState; messages: ChatMessage[] } {
  const messages: ChatMessage[] = []
  let guard = 0

  while (state.currentNodeId && guard++ < 100) {
    const node = flow.nodes[state.currentNodeId]
    if (!node) break
    state.history.push(node.id)

    switch (node.type) {
      case 'message':
        messages.push({
          id: mid(),
          role: 'bot',
          text: resolve(node.textKey, locale),
          ...(node.audioUrl !== undefined ? { audioUrl: node.audioUrl } : {}),
          ...(node.audioIntroKey !== undefined ? { audioIntro: resolve(node.audioIntroKey, locale) } : {}),
          timestamp: Date.now(),
          nodeId: node.id,
        })
        state.currentNodeId = node.next
        break

      case 'faq':
        messages.push({
          id: mid(),
          role: 'bot',
          text: resolve(node.answerKey, locale),
          ...(node.audioUrl !== undefined ? { audioUrl: node.audioUrl } : {}),
          timestamp: Date.now(),
          nodeId: node.id,
        })
        state.currentNodeId = node.backTo
        state.suppressNextPrompt = true // don't replay the menu prompt next loop
        break

      case 'refusal':
        messages.push({
          id: mid(),
          role: 'bot',
          text: resolve(node.textKey, locale),
          timestamp: Date.now(),
          nodeId: node.id,
        })
        state.currentNodeId = node.backTo
        state.suppressNextPrompt = true
        break

      case 'triage': {
        // Free text never routes itself. The host's resolver returns a verdict
        // about the text; every destination comes from this node's own fields,
        // so an unrecognized verdict — or a `static` hit outside `allow` —
        // lands on the fixed refusal node instead of being followed.
        const question = state.data[node.field] ?? ''
        const outcome: TriageOutcome = triage ? triage(question, locale) : { kind: 'ai' }
        if (outcome.kind === 'static' && node.allow.includes(outcome.nodeId)) {
          state.currentNodeId = outcome.nodeId
        } else if (outcome.kind === 'ai') {
          state.currentNodeId = node.aiFallback
        } else {
          state.currentNodeId = node.refuseTo
        }
        break
      }

      case 'ai-fallback':
        // Answer once, then `backTo` — same shape as faq/refusal. The graph,
        // not this loop, is what stops a second AI turn: the node has no edge
        // back into itself to follow.
        messages.push({
          id: mid(),
          role: 'bot',
          text: resolve(node.textKey, locale),
          timestamp: Date.now(),
          nodeId: node.id,
        })
        state.currentNodeId = node.backTo
        state.suppressNextPrompt = true
        break

      case 'handoff':
        messages.push({ id: mid(), role: 'bot', text: resolve(node.textKey, locale), timestamp: Date.now(), nodeId: node.id })
        state.effects.push({ type: 'handoff' })
        state.currentNodeId = node.next
        break

      case 'capture':
        state.target = node.target
        state.effects.push({ type: 'capture', target: node.target })
        state.currentNodeId = node.next
        break

      case 'choice':
        // Consumed here, specifically by the node type that needs it — not
        // at the top of the loop — so the suppression survives any
        // intervening auto-advancing nodes (message/capture/handoff) a
        // faq/refusal node's `backTo` might pass through before reaching
        // the actual choice node whose prompt should be skipped.
        if (!state.suppressNextPrompt) {
          messages.push({ id: mid(), role: 'bot', text: resolve(node.promptKey, locale), timestamp: Date.now(), nodeId: node.id })
        }
        state.suppressNextPrompt = false
        return { state, messages }

      case 'input':
        messages.push({ id: mid(), role: 'bot', text: resolve(node.promptKey, locale), timestamp: Date.now(), nodeId: node.id })
        return { state, messages } // wait for the user

      case 'component':
        if (node.textKey) {
          messages.push({ id: mid(), role: 'bot', text: resolve(node.textKey, locale), timestamp: Date.now(), nodeId: node.id })
        }
        return { state, messages } // wait for the host to mount the component

      case 'link':
        messages.push({ id: mid(), role: 'bot', text: resolve(node.textKey, locale), timestamp: Date.now(), nodeId: node.id })
        return { state, messages } // wait for the host to render the CTA

      case 'end':
        messages.push({ id: mid(), role: 'bot', text: resolve(node.textKey, locale), timestamp: Date.now(), nodeId: node.id })
        state.currentNodeId = null
        state.status = 'done'
        return { state, messages }
    }
  }

  return { state, messages }
}

/** Start a flow: returns initial state + the opening bot messages. */
export function start(
  flow: FlowGraph,
  locale: Locale,
  resolve: TextResolver,
  triage?: TriageResolver,
): { state: EngineState; messages: ChatMessage[] } {
  return runForward(flow, createInitialState(flow), locale, resolve, triage)
}

/** Derive what the UI must render now from the current node. */
export function getInteraction(state: EngineState, flow: FlowGraph, locale: Locale, resolve: TextResolver): Interaction {
  if (!state.currentNodeId) return { kind: 'none' }
  const node = flow.nodes[state.currentNodeId]
  if (!node) return { kind: 'none' }

  if (node.type === 'choice') {
    return {
      kind: 'choice',
      options: node.options.map((o) => ({ label: resolve(o.labelKey, locale), value: o.value })),
    }
  }

  if (node.type === 'input') {
    return {
      kind: 'input',
      field: node.field,
      inputType: node.inputType,
      optional: !!node.optional,
      placeholder: resolve(node.promptKey, locale),
      ...(node.options !== undefined
        ? { options: node.options.map((o) => ({ label: resolve(o.labelKey, locale), value: o.value })) }
        : {}),
    }
  }

  if (node.type === 'component') {
    return { kind: 'component', componentId: node.componentId }
  }

  if (node.type === 'link') {
    return { kind: 'link', href: node.href, label: resolve(node.labelKey, locale) }
  }

  return { kind: 'none' }
}

/**
 * Apply the user's answer to the current node and advance.
 * Pure relative to `prev` (clones state). On a validation failure it returns the
 * same position with `error` set, so the UI can re-prompt without losing context.
 */
export function advance(
  flow: FlowGraph,
  prev: EngineState,
  rawValue: string,
  locale: Locale,
  resolve: TextResolver,
  triage?: TriageResolver,
): { state: EngineState; messages: ChatMessage[] } {
  const state: EngineState = {
    ...prev,
    data: { ...prev.data },
    history: [...prev.history],
    effects: [],
    error: null,
  }

  const node = state.currentNodeId ? flow.nodes[state.currentNodeId] : null
  if (!node) return { state, messages: [] }

  const value = rawValue.trim()
  const messages: ChatMessage[] = []

  if (node.type === 'choice') {
    const chosen = node.options.find((o) => o.value === value)
    if (!chosen) {
      state.error = resolve('system.invalidChoice', locale)
      return { state, messages }
    }
    if (chosen.set) Object.assign(state.data, chosen.set)
    if (chosen.setTarget) state.target = chosen.setTarget
    messages.push({ id: mid(), role: 'user', text: resolve(chosen.labelKey, locale), timestamp: Date.now() })
    state.currentNodeId = chosen.next
    const fwd = runForward(flow, state, locale, resolve, triage)
    return { state: fwd.state, messages: [...messages, ...fwd.messages] }
  }

  if (node.type === 'input') {
    // optional + empty -> skip without recording
    if (node.optional && value === '') {
      state.currentNodeId = node.next
      const fwd = runForward(flow, state, locale, resolve, triage)
      return { state: fwd.state, messages: fwd.messages }
    }
    if (node.validate && !validators[node.validate](value)) {
      state.error = resolve(`system.invalid.${node.validate}`, locale)
      return { state, messages }
    }
    if (node.inputType === 'select' && node.options && !node.options.some((o) => o.value === value)) {
      state.error = resolve('system.invalidChoice', locale)
      return { state, messages }
    }
    state.data[node.field] = value
    const picked = node.options?.find((o) => o.value === value)
    messages.push({ id: mid(), role: 'user', timestamp: Date.now(), text: picked ? resolve(picked.labelKey, locale) : value })
    state.currentNodeId = node.next
    const fwd = runForward(flow, state, locale, resolve, triage)
    return { state: fwd.state, messages: [...messages, ...fwd.messages] }
  }

  return { state, messages }
}
