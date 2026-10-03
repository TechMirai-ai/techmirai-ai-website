'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { advance, getInteraction, start } from '@techmirai/reception-engine'
import type { ChatMessage, EngineState, Interaction, Locale as EngineLocale, NodeId } from '@techmirai/reception-engine'
import enMessages from '../../../../i18n/messages/en.json'
import jaMessages from '../../../../i18n/messages/ja.json'
import { clinicReceptionFlow, FAQ_STAFF_LINK_NODE_ID, FAQ_STAFF_OPTION_VALUE } from '../flow'
import { createReceptionTextResolver } from '../resolver'
import { screenQuestion } from '../screening'
import { createClinicTriageResolver } from '../triage'
import { requestReceptionAiAnswer, type RequestReceptionAiAnswer } from './ai-client'

type MessageNode = string | { [key: string]: MessageNode }
type MessageTree = { [key: string]: MessageNode }

const BASE_MESSAGES: Record<'en' | 'ja', MessageTree> = {
  en: enMessages,
  ja: jaMessages,
}

const AI_OFF_TOPIC_KEY = 'reception.faq.ai.offTopic'
const REFUSAL_KEY = 'reception.refusal.text'

function toEngineLocale(locale: string): 'en' | 'ja' {
  return locale === 'ja' ? 'ja' : 'en'
}

/**
 * True when the node awaiting input feeds a triage node — i.e. when what the
 * visitor is about to submit is a free-text question that may need an AI
 * answer fetched before the flow advances. Derived from the graph rather than
 * hardcoded to `faq.ask`, so a second free-text node would not silently skip
 * the fetch (or a non-triage input node pay for one).
 */
function leadsToTriage(nodeId: NodeId | null): boolean {
  if (!nodeId) return false
  const node = clinicReceptionFlow.nodes[nodeId]
  if (!node || node.type !== 'input') return false
  return clinicReceptionFlow.nodes[node.next]?.type === 'triage'
}

/**
 * Site-config-driven visibility for the "Talk to staff" LINE link (part 5).
 * `staffLineUrl` is per-client config the flow graph itself cannot hold (see
 * flow.ts's faq.staff doc comment), so the host applies it here: the faq.menu
 * choice never offers the option without a configured URL, and — as a second
 * line of defense in case that node were ever reached anyway — the link node
 * itself degrades to `{ kind: 'none' }` rather than rendering an empty href.
 */
function withStaffLineAvailability(interaction: Interaction, nodeId: NodeId | null, staffLineUrl: string | undefined): Interaction {
  const trimmedUrl = staffLineUrl?.trim()

  if (interaction.kind === 'choice' && nodeId === 'faq.menu' && !trimmedUrl) {
    return { ...interaction, options: interaction.options.filter((o) => o.value !== FAQ_STAFF_OPTION_VALUE) }
  }

  if (interaction.kind === 'link' && nodeId === FAQ_STAFF_LINK_NODE_ID) {
    return trimmedUrl ? { ...interaction, href: trimmedUrl } : { kind: 'none' }
  }

  return interaction
}

export interface UseReceptionEngineArgs {
  locale: string
  /** Per-locale greeting override from site.config.reception.greeting — takes
   * priority over the package's built-in reception.greeting i18n copy. */
  greeting: Record<string, string>
  clinicPhone: string
  /** FAQ answers for this locale, keyed faq.<slug> — see faq-answers.ts (static, sourced from faq-content.ts, not fetched here). */
  faqAnswers: Record<string, string>
  /**
   * site.config.ts's reception.staffLineUrl. The faq.menu "Talk to staff"
   * option is hidden entirely when this is unset — see withStaffLineAvailability.
   */
  staffLineUrl?: string
  /** Injectable for tests; defaults to the real POST /api/reception/ai client. */
  requestAiAnswer?: RequestReceptionAiAnswer
}

export interface UseReceptionEngineResult {
  locale: EngineLocale
  messages: ChatMessage[]
  interaction: Interaction
  done: boolean
  error: string | null
  /** Synchronous advance — for menu buttons and any input that cannot need an AI answer. */
  send: (value: string) => void
  /** Free-text submit: resolves the AI answer first (when one is needed), then advances. */
  submitQuestion: (value: string) => Promise<void>
  restart: () => void
}

/**
 * Bridges the pure reception-engine to React state. Owns EngineState,
 * builds the host TextResolver (static i18n copy + FAQ answers +
 * config-supplied greeting override), and re-runs `start` when the locale
 * changes — mirroring sadiatec-assistant's useFlowEngine, minus any fetch:
 * FAQ content arrives as a plain prop, already built by faq-answers.ts.
 *
 * The one fetch that does live here is the AI answer, and it happens BEFORE
 * `advance` rather than in response to it: the engine is synchronous and its
 * `ai-fallback` node resolves its text through the TextResolver like every
 * other node, so the answer has to be in hand by the time that node renders.
 */
export function useReceptionEngine({
  locale,
  greeting,
  clinicPhone,
  faqAnswers,
  staffLineUrl,
  requestAiAnswer = requestReceptionAiAnswer,
}: UseReceptionEngineArgs): UseReceptionEngineResult {
  const engineLocale = toEngineLocale(locale)

  // Holds the text for the ai-fallback node currently being answered. A ref,
  // not state: it is read synchronously by the resolver inside the very
  // `advance` call that follows setting it, which a state update would not be
  // visible to. Cleared before every submission so a stale answer can never
  // be shown against a new question.
  const aiAnswerRef = useRef<string | null>(null)

  const resolve = useMemo(() => {
    const base = BASE_MESSAGES[engineLocale]
    const baseReception = base['reception']
    const receptionOverride: MessageTree = {
      ...(typeof baseReception === 'object' ? baseReception : {}),
      ...(greeting[locale] !== undefined ? { greeting: greeting[locale] } : {}),
    }
    const merged: MessageTree = { ...base, reception: receptionOverride }

    return createReceptionTextResolver({
      messages: { [engineLocale]: merged },
      faqAnswers,
      phone: clinicPhone,
      aiAnswer: () => aiAnswerRef.current,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineLocale, locale, greeting, clinicPhone, faqAnswers])

  // Routing for the faq.ask.triage node: the medical screen (Part 4) in front
  // of the static fuse.js FAQ match (Part 3, sourced from faq-content.ts —
  // no longer CMS/i18n-dependent), falling through to the AI node. Rebuilt
  // only when the locale changes.
  const triage = useMemo(() => createClinicTriageResolver(engineLocale), [engineLocale])

  const [session, setSession] = useState<{ state: EngineState; messages: ChatMessage[] }>(() => {
    const result = start(clinicReceptionFlow, engineLocale, resolve, triage)
    return { state: result.state, messages: result.messages }
  })

  // The useState initializer above already runs `start` once for the first
  // render; skip re-running it here on mount and only restart when the
  // locale actually changes afterward.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    aiAnswerRef.current = null
    const result = start(clinicReceptionFlow, engineLocale, resolve, triage)
    setSession({ state: result.state, messages: result.messages })
    // Locale switch restarts the conversation, matching the reference widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineLocale])

  // Side effects (`capture`/`handoff`) are surfaced by advance()/start() but
  // deliberately not consumed here — clinicReceptionFlow has no capture or
  // handoff nodes today (booking/manage go through dedicated component/link
  // nodes instead). A future flow that adds one will need this hook to also
  // act on `result.state.effects` (e.g. notify staff, persist a lead).
  function send(value: string) {
    setSession((prev) => {
      const result = advance(clinicReceptionFlow, prev.state, value, engineLocale, resolve, triage)
      return { state: result.state, messages: [...prev.messages, ...result.messages] }
    })
  }

  /**
   * Turns one free-text question into the text the ai-fallback node will show.
   * Returns null for every outcome that should fall back to the static
   * "we could not answer that, please call us" copy — a failed, timed-out,
   * rate-limited or unconfigured model all land here, and none of them can
   * surface an error string or leave the bubble empty.
   */
  async function resolveAiText(question: string): Promise<string | null> {
    // Layer 2, browser side: recognizably off-topic but not medical. Answered
    // from fixed copy without a request, so junk costs nothing. The route
    // re-runs the same screen for callers that skip the widget.
    if (screenQuestion(question) === 'off-topic') return resolve(AI_OFF_TOPIC_KEY, engineLocale)

    const result = await requestAiAnswer({ question, locale: engineLocale })
    switch (result.status) {
      case 'answered':
        return result.answer ?? null
      case 'off-topic':
        return resolve(AI_OFF_TOPIC_KEY, engineLocale)
      case 'refused':
        // Unreachable through the widget — `triage` already routed medical
        // text to refusal.medical without calling this. Mapped anyway so the
        // server staying stricter than the client can never produce a
        // mismatched message.
        return resolve(REFUSAL_KEY, engineLocale)
      default:
        return null
    }
  }

  async function submitQuestion(value: string): Promise<void> {
    aiAnswerRef.current = null
    const question = value.trim()

    if (question && leadsToTriage(session.state.currentNodeId)) {
      // The same pure verdict `advance` will compute a moment later, asked
      // early so nothing is fetched for a question that is about to be
      // refused or answered from an existing FAQ entry.
      if (triage(question, engineLocale).kind === 'ai') {
        aiAnswerRef.current = await resolveAiText(question)
      }
    }

    send(value)
  }

  function restart() {
    aiAnswerRef.current = null
    const result = start(clinicReceptionFlow, engineLocale, resolve, triage)
    setSession({ state: result.state, messages: result.messages })
  }

  return {
    locale: engineLocale,
    messages: session.messages,
    interaction: withStaffLineAvailability(
      getInteraction(session.state, clinicReceptionFlow, engineLocale, resolve),
      session.state.currentNodeId,
      staffLineUrl,
    ),
    done: session.state.status === 'done',
    error: session.state.error,
    send,
    submitQuestion,
    restart,
  }
}
