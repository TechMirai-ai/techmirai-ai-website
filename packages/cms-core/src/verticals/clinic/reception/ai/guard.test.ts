import { describe, expect, it } from 'vitest'
import { guardAnswer } from './guard'

const price = { ok: false, reason: 'guarded:price' }
const voice = { ok: false, reason: 'guarded:voice' }

describe('guardAnswer — prices', () => {
  it.each([
    ['the published setup price, as the Spec writes it', 'The Starter Package starts from ¥300,000 for setup.'],
    ['the published monthly price', 'It is ¥30,000 per month.'],
    ['the published prices in Japanese man-yen form', '初期費用30万円〜、月額3万円〜です。'],
    ['full-width yen and digits', '初期費用は￥３００，０００からです。'],
    ['no amount at all', 'Prices come after a free assessment.'],
    ['a number that is not money', 'We reply within 3 business days, in 2 languages.'],
  ])('lets through %s', (_label, text) => {
    expect(guardAnswer(text)).toEqual({ ok: true })
  })

  it.each([
    ['an invented yen price', 'It costs ¥50,000 to set up.'],
    ['a yen price written with 円', '月額は5,000円です。'],
    ['a man-yen price that is not published', '初期費用は10万円です。'],
    ['a dollar price', 'That is about $500 per month.'],
    ['a price in words and a code', 'The fee is 80,000 yen.'],
    ['a percentage discount', 'We can give you 20% off.'],
    ['a discount in Japanese', '2割引でご提供できます。'],
  ])('blocks %s', (_label, text) => {
    expect(guardAnswer(text)).toEqual(price)
  })

  it('blocks a made-up price even when a published one is also stated', () => {
    expect(guardAnswer('From ¥300,000, or ¥120,000 for the lite plan.')).toEqual(price)
  })
})

describe('guardAnswer — Voice availability', () => {
  it.each([
    ['AI受付 Voice is available now.'],
    ['Our voice version is already live.'],
    ['The phone version is currently available.'],
    ['電話版は提供中です。'],
    ['音声対応はご利用いただけます。'],
  ])('blocks a claim that Voice is available: %s', (text) => {
    expect(guardAnswer(text)).toEqual(voice)
  })

  it.each([
    ['AI受付 Voice is in development — we can show you a demo.'],
    ['The phone version is not yet available, but a demo is.'],
    ['AI受付（電話）は現在開発中で、デモをご覧いただけます。'],
    ['AI受付 Web is available now. AI受付 Voice is in development.'],
    ['AI受付（Web）は提供中です。電話に対応するAI受付（電話）は現在開発中です。'],
  ])('lets through an honest statement: %s', (text) => {
    expect(guardAnswer(text)).toEqual({ ok: true })
  })

  it('does not mistake an unrelated "available" for a Voice claim', () => {
    expect(guardAnswer('The web version is available now and bookings are open.')).toEqual({ ok: true })
  })

  it('judges each sentence on its own, so a later honest sentence cannot excuse an earlier claim', () => {
    expect(guardAnswer('Voice is available now. It is in development for some languages.')).toEqual(voice)
  })
})

describe('guardAnswer — scope', () => {
  it('does not judge anything else: a long, off-topic or unhelpful reply passes', () => {
    expect(guardAnswer('I think the weather is nice. '.repeat(10))).toEqual({ ok: true })
    expect(guardAnswer('')).toEqual({ ok: true })
  })
})
