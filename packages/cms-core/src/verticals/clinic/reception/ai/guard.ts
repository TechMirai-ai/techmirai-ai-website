// ─────────────────────────────────────────────────────────────────────────────
// Output guard — the one deterministic check on what the model says (K2).
//
// The prompt (Spec §16.4) tells the model never to state a price other than the
// published starting prices and never to say AI受付 Voice is available now. A
// prompt is a request, not a guarantee, and the Spec's test script asserts that
// "no price or promise appears". So the two claims that would be most damaging
// if wrong are also checked here, on the reply, by pattern. Everything else —
// tone, length, relevance — stays the prompt's job; this file does not try to
// judge an answer's quality.
//
// A guarded reply is never shown. The caller treats it like any other model
// failure and the visitor gets the fixed "I'm not sure about that" hand-off.
// ─────────────────────────────────────────────────────────────────────────────

import { getEntry } from '../techmirai-chat-content'

export type GuardVerdict = { ok: true } | { ok: false; reason: 'guarded:price' | 'guarded:voice' }

/** An amount with its currency resolved: yen as a number, anything else as `null`. */
interface Amount {
  yen: number | null
}

const MONEY =
  /[¥￥]\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(万円|円|yen|jpy)|\$\s?\d[\d,]*|(\d[\d,]*(?:\.\d+)?)\s?(usd|dollars?)/gi

/** `1,000` -> 1000 */
function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ''))
}

function amountsIn(text: string): Amount[] {
  const amounts: Amount[] = []
  for (const match of text.normalize('NFKC').matchAll(MONEY)) {
    if (match[1] !== undefined) amounts.push({ yen: toNumber(match[1]) })
    else if (match[2] !== undefined) {
      const unit = match[3]!.toLowerCase()
      amounts.push({ yen: toNumber(match[2]) * (unit === '万円' ? 10_000 : 1) })
    } else amounts.push({ yen: null }) // a dollar amount can never be a published price
  }
  return amounts
}

/** A discount stated as a number: "20% off", "10% discount", "2割引". */
const DISCOUNT = /\d+(?:\.\d+)?\s?%\s?(?:off|discount)|\d+\s?割\s?(?:引|オフ)|(?:off|discount)\s?(?:of\s)?\d+\s?%/i

/**
 * The published starting prices, read from the same B3 answer the chat shows
 * (so there is one source). They are bracketed in the Spec — unconfirmed — but
 * they are the only prices the Spec allows the assistant to state.
 */
function publishedPrices(): ReadonlySet<number> {
  const b3 = getEntry('b3')
  const text = b3 ? `${b3.answer.en} ${b3.answer.ja}` : ''
  return new Set(
    amountsIn(text)
      .map((a) => a.yen)
      .filter((yen): yen is number => yen !== null),
  )
}

const ALLOWED_PRICES = publishedPrices()

const VOICE_TOPIC = /\bvoice\b|phone (?:version|edition|reception|answering)|telephone (?:version|reception)|電話(?:版|受付|に対応)|音声/i
const AVAILABLE_NOW =
  /\b(?:is|are)\s+(?:now\s+|already\s+|currently\s+)?(?:available|live|ready|launched|released|offered)\b|\b(?:now|already|currently)\s+(?:available|live|ready)\b|提供中|ご利用いただけます|利用可能|使えます|ご利用可能/i
const IN_DEVELOPMENT = /in development|under development|being developed|not (?:yet )?available|coming soon|開発中|準備中|未提供|提供予定/i

/** Splits on sentence-ending punctuation in either language, keeping each sentence whole. */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?。！？])\s*/u).filter(Boolean)
}

export function guardAnswer(answer: string): GuardVerdict {
  for (const amount of amountsIn(answer)) {
    if (amount.yen === null || !ALLOWED_PRICES.has(amount.yen)) return { ok: false, reason: 'guarded:price' }
  }
  if (DISCOUNT.test(answer.normalize('NFKC'))) return { ok: false, reason: 'guarded:price' }

  for (const sentence of sentences(answer)) {
    if (VOICE_TOPIC.test(sentence) && AVAILABLE_NOW.test(sentence) && !IN_DEVELOPMENT.test(sentence)) {
      return { ok: false, reason: 'guarded:voice' }
    }
  }

  return { ok: true }
}
