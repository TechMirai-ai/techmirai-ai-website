'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { advance, getInteraction, goTo, start } from '@techmirai/reception-engine'
import type { ChatMessage, EngineState, Interaction, Locale as EngineLocale, TextResolver } from '@techmirai/reception-engine'
import enMessages from '../../../../i18n/messages/en.json'
import jaMessages from '../../../../i18n/messages/ja.json'
import { isWithinHandoffHours, type HandoffHours } from '../handoff-hours'
import { createReceptionTextResolver } from '../resolver'
import { screenQuestion } from '../screening'
import {
  B6_ANSWER_KEY,
  buildTechmiraiMessages,
  HANDOFF_AWAY_KEY,
  HANDOFF_OPEN_KEY,
  HOST_LINK_PREFIX,
  QUESTION_FIELD,
  TALK_TO_PERSON_NODE_ID,
  TRIAGE_NODE_ID,
} from '../techmirai-chat-content'
import { techmiraiReceptionFlow } from '../techmirai-flow'
import { createTechmiraiTriageResolver } from '../techmirai-triage'
import { requestReceptionAiAnswer, type RequestReceptionAiAnswer } from './ai-client'

type MessageNode = string | { [key: string]: MessageNode }
type MessageTree = { [key: string]: MessageNode }

const BASE_MESSAGES: Record<'en' | 'ja', MessageTree> = {
  en: enMessages,
  ja: jaMessages,
}

const flow = techmiraiReceptionFlow

/** The Spec rule-13 redirect (a labelled placeholder until the Spec gives wording) — for the server's `off-topic` status. */
const AI_OFF_TOPIC_KEY = 'reception.tm.off-topic.answer'
/** Spec 16.3 F09 — the same "no medical or legal advice" answer the triage routes to. */
const REFUSAL_KEY = 'reception.tm.f09.answer'

/** Digits needed before a configured phone number is dialable. */
const MIN_DIALABLE_DIGITS = 8

function toEngineLocale(locale: string): 'en' | 'ja' {
  return locale === 'ja' ? 'ja' : 'en'
}

const realClock = (): Date => new Date()

/**
 * Which text answers "talk to a person" right now: Spec §16.5's during-hours or
 * outside-hours message when the schedule is known, B6's own answer (Spec §16.2,
 * which makes no claim about the moment) when it is not or cannot be read.
 */
function handoffAnswerKey(hours: HandoffHours | undefined, now: () => Date): string {
  if (!hours) return B6_ANSWER_KEY
  const open = isWithinHandoffHours(now(), hours)
  if (open === null) return B6_ANSWER_KEY
  return open ? HANDOFF_OPEN_KEY : HANDOFF_AWAY_KEY
}

/** Per-client URLs the package-level flow cannot hold. A missing one hides its button. */
export interface HostLinks {
  /** The staff LINE account (site.config reception.staffLineUrl). */
  line?: string
  /** The live demo site. Must be an http(s) URL — a bracketed placeholder is not one. */
  demo?: string
  /** The brochure PDF. */
  brochure?: string
}

const HTTP_URL = /^https?:\/\//

function resolveHostLinks(hostLinks: HostLinks | undefined, phone: string): Record<string, string> {
  const resolved: Record<string, string> = {}
  for (const name of ['line', 'demo', 'brochure'] as const) {
    const url = hostLinks?.[name]?.trim()
    if (url && HTTP_URL.test(url)) resolved[name] = url
  }
  const dialable = phone.replace(/[^\d+]/g, '')
  if (dialable.replace(/\D/g, '').length >= MIN_DIALABLE_DIGITS) resolved['tel'] = `tel:${dialable}`
  return resolved
}

/**
 * Swaps a `@name` option href for its configured URL and drops the option when
 * there is none, so the chat never renders a dead button or an empty href.
 */
function withHostLinks(interaction: Interaction, links: Record<string, string>): Interaction {
  if (interaction.kind !== 'choice') return interaction
  const options = interaction.options.flatMap((option) => {
    if (!option.href?.startsWith(HOST_LINK_PREFIX)) return [option]
    const url = links[option.href.slice(HOST_LINK_PREFIX.length)]
    return url ? [{ ...option, href: url }] : []
  })
  return { ...interaction, options }
}

export interface UseReceptionEngineArgs {
  locale: string
  /** Per-locale greeting override from site.config.reception.greeting — takes
   * priority over the package's built-in reception.greeting i18n copy. */
  greeting: Record<string, string>
  /** The configured phone number; becomes the "Call" button when dialable. */
  clinicPhone: string
  hostLinks?: HostLinks
  /**
   * When the team replies (site.config reception.handoffHours). With it, a
   * request for a person shows the Spec §16.5 "during hours" or "outside hours"
   * message; without it, B6's own answer. The schedule is an unconfirmed
   * launch blocker (register K2-01).
   */
  handoffHours?: HandoffHours
  /** Injectable clock, so the out-of-hours case is testable. Defaults to the real time. */
  now?: () => Date
  /** Injectable for tests; defaults to the real POST /api/reception/ai client. */
  requestAiAnswer?: RequestReceptionAiAnswer
}

export interface UseReceptionEngineResult {
  locale: EngineLocale
  messages: ChatMessage[]
  interaction: Interaction
  done: boolean
  error: string | null
  /** Synchronous advance — for menu buttons. */
  send: (value: string) => void
  /** Free-text submit: resolves the AI answer first (when one is needed), then routes the question. */
  submitQuestion: (value: string) => Promise<void>
  /** The always-visible "Talk to a person" link: jumps to the hand-off node from anywhere. */
  talkToPerson: () => void
  restart: () => void
}

/**
 * Bridges the pure reception-engine to React state. Owns EngineState, builds
 * the host TextResolver (the TechMirai message tree over the base i18n copy,
 * with the config-supplied greeting override on top), and re-runs `start` when
 * the locale changes.
 *
 * The one fetch that lives here is the AI answer, and it happens BEFORE the
 * engine is told about the question: the engine is synchronous and its
 * `ai-fallback` node resolves its text through the TextResolver like every
 * other node, so the answer has to be in hand by the time that node renders.
 */
export function useReceptionEngine({
  locale,
  greeting,
  clinicPhone,
  hostLinks,
  handoffHours,
  now = realClock,
  requestAiAnswer = requestReceptionAiAnswer,
}: UseReceptionEngineArgs): UseReceptionEngineResult {
  const engineLocale = toEngineLocale(locale)

  // Holds the text for the ai-fallback node currently being answered. A ref,
  // not state: it is read synchronously by the resolver inside the very
  // engine call that follows setting it, which a state update would not be
  // visible to. Cleared before every submission so a stale answer can never
  // be shown against a new question.
  const aiAnswerRef = useRef<string | null>(null)

  const resolve = useMemo(() => {
    const tm = buildTechmiraiMessages(engineLocale)
    const receptionOverride: MessageTree = {
      ...(tm as MessageTree),
      ...(greeting[locale] !== undefined ? { greeting: greeting[locale] } : {}),
    }
    const merged: MessageTree = { ...BASE_MESSAGES[engineLocale], reception: receptionOverride }

    const base = createReceptionTextResolver({
      messages: { [engineLocale]: merged },
      faqAnswers: {},
      phone: clinicPhone,
      aiAnswer: () => aiAnswerRef.current,
    })
    // B6 is asked for from many places (the menu, the header link, a typed
    // request, the AI hand-off). Choosing its wording here, at the moment the
    // message is made, covers all of them without a second node per variant.
    const resolveText: TextResolver = (key, resolveLocale, params) =>
      base(key === B6_ANSWER_KEY ? handoffAnswerKey(handoffHours, now) : key, resolveLocale, params)
    return resolveText
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineLocale, locale, greeting, clinicPhone, handoffHours, now])

  const triage = useMemo(() => createTechmiraiTriageResolver(engineLocale), [engineLocale])
  const links = useMemo(() => resolveHostLinks(hostLinks, clinicPhone), [hostLinks, clinicPhone])

  const [session, setSession] = useState<{ state: EngineState; messages: ChatMessage[] }>(() => {
    const result = start(flow, engineLocale, resolve, triage)
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
    const result = start(flow, engineLocale, resolve, triage)
    setSession({ state: result.state, messages: result.messages })
    // Locale switch restarts the conversation, matching the reference widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineLocale])

  // Side effects (`capture`/`handoff`) are surfaced by advance()/start() but
  // deliberately not consumed here — the flow has no capture or handoff nodes
  // (booking and contact go through the inline component and link buttons).
  function send(value: string) {
    setSession((prev) => {
      const result = advance(flow, prev.state, value, engineLocale, resolve, triage)
      return { state: result.state, messages: [...prev.messages, ...result.messages] }
    })
  }

  function talkToPerson() {
    aiAnswerRef.current = null
    setSession((prev) => {
      const result = goTo(flow, prev.state, TALK_TO_PERSON_NODE_ID, engineLocale, resolve, triage)
      return { state: result.state, messages: [...prev.messages, ...result.messages] }
    })
  }

  /**
   * Turns one free-text question into the text the ai-fallback node will show.
   * Returns null for every outcome that should fall back to the static
   * "I'm not sure about that" copy — a failed, timed-out, rate-limited or
   * unconfigured model all land here, and none of them can surface an error
   * string or leave the bubble empty.
   */
  async function resolveAiText(question: string): Promise<string | null> {
    // Recognizably off-topic but not medical: fixed copy, no request, so junk costs nothing.
    if (screenQuestion(question) === 'off-topic') return resolve(AI_OFF_TOPIC_KEY, engineLocale)

    const result = await requestAiAnswer({ question, locale: engineLocale })
    switch (result.status) {
      case 'answered':
        return result.answer ?? null
      case 'off-topic':
        return resolve(AI_OFF_TOPIC_KEY, engineLocale)
      case 'refused':
        // The triage already routes medical text to F09 without calling this;
        // mapped anyway so a stricter server can never produce a mismatched message.
        return resolve(REFUSAL_KEY, engineLocale)
      default:
        return null
    }
  }

  async function submitQuestion(value: string): Promise<void> {
    aiAnswerRef.current = null
    const question = value.trim()
    if (!question) return

    // The same pure verdict the engine computes a moment later, asked early so
    // nothing is fetched for a question answered from a matched entry.
    if (triage(question, engineLocale).kind === 'ai') {
      aiAnswerRef.current = await resolveAiText(question)
    }

    setSession((prev) => {
      const withQuestion: EngineState = { ...prev.state, data: { ...prev.state.data, [QUESTION_FIELD]: question } }
      const result = goTo(flow, withQuestion, TRIAGE_NODE_ID, engineLocale, resolve, triage)
      const asked: ChatMessage = { id: `q_${Date.now().toString(36)}`, role: 'user', text: question, timestamp: Date.now() }
      return { state: result.state, messages: [...prev.messages, asked, ...result.messages] }
    })
  }

  function restart() {
    aiAnswerRef.current = null
    const result = start(flow, engineLocale, resolve, triage)
    setSession({ state: result.state, messages: result.messages })
  }

  return {
    locale: engineLocale,
    messages: session.messages,
    interaction: withHostLinks(getInteraction(session.state, flow, engineLocale, resolve), links),
    done: session.state.status === 'done',
    error: session.state.error,
    send,
    submitQuestion,
    talkToPerson,
    restart,
  }
}
