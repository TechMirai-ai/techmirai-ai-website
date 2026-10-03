import type { Locale, TextResolver } from '@techmirai/reception-engine'
import { RECEPTION_AI_ANSWER_KEY } from './flow'

type MessageNode = string | { [key: string]: MessageNode }
type MessageTree = { [key: string]: MessageNode }

function lookupNested(tree: MessageTree | undefined, key: string): string | undefined {
  if (!tree) return undefined
  let node: MessageNode | undefined = tree
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(text: string, params: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? params[name]! : match))
}

export interface CreateReceptionTextResolverArgs {
  /** Nested-namespace message tree per locale, same shape as cms-core's i18n JSON. */
  messages: Partial<Record<Locale, MessageTree>>
  /** FAQ answers (faq-answers.ts, sourced from faq-content.ts), keyed `faq.<slug>`, already locale-specific. */
  faqAnswers: Record<string, string>
  phone: string
  /**
   * The grounded answer for the question currently being answered, if the
   * host has one. A getter rather than a value because the answer arrives
   * asynchronously, after this resolver has already been built and handed to
   * the engine — the host updates a ref and the engine reads it at the moment
   * it renders the ai-fallback node, within the same synchronous `advance`
   * call. Returning null/empty falls through to the static copy for
   * RECEPTION_AI_ANSWER_KEY, which is the safe "please call us" message.
   */
  aiAnswer?: () => string | null | undefined
}

/**
 * Builds a TextResolver that merges static i18n copy, FAQ answers (see
 * faq-answers.ts — static content, not CMS-sourced), and the host's current
 * grounded AI answer. `faq.<slug>` keys resolve from `faqAnswers`;
 * everything else resolves from `messages`. All non-FAQ lookups
 * (system copy, including the refusal message) get `{phone}` interpolated —
 * the flow graph itself never embeds the phone number.
 */
export function createReceptionTextResolver({ messages, faqAnswers, phone, aiAnswer }: CreateReceptionTextResolverArgs): TextResolver {
  return (key, locale) => {
    if (key === RECEPTION_AI_ANSWER_KEY) {
      // Deliberately NOT interpolated with {phone}: this is model output, and
      // the only reason to run a replace over it would be to let it contain
      // template syntax the resolver then expands.
      const answer = aiAnswer?.()
      if (answer && answer.trim()) return answer.trim()
    }

    if (key.startsWith('faq.')) {
      const answer = faqAnswers[key]
      if (answer) return answer
      const fallback = lookupNested(messages[locale], 'reception.faq.notFound') ?? key
      return interpolate(fallback, { phone })
    }

    const text = lookupNested(messages[locale], key)
    if (text === undefined) return key
    return interpolate(text, { phone })
  }
}
