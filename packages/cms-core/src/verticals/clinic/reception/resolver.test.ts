import { describe, expect, it } from 'vitest'
import { RECEPTION_AI_ANSWER_KEY } from './flow'
import { createReceptionTextResolver } from './resolver'

const messages = {
  ja: {
    reception: {
      greeting: 'こんにちは',
      refusal: { text: '担当の施術者に直接ご確認ください。お電話：{phone}' },
      faq: {
        notFound: '準備中です。お電話でお問い合わせください：{phone}',
        ai: { answer: 'ご案内できませんでした。お電話ください：{phone}' },
      },
    },
  },
  en: {
    reception: {
      greeting: 'Hello',
      refusal: { text: 'Please ask the practitioner directly. Phone: {phone}' },
      faq: {
        notFound: 'Coming soon. Please call: {phone}',
        ai: { answer: "We couldn't answer that. Please call: {phone}" },
      },
    },
  },
}

describe('createReceptionTextResolver', () => {
  it('resolves a static key from the nested messages tree for the given locale', () => {
    const resolve = createReceptionTextResolver({ messages, faqAnswers: {}, phone: '+81-3-5432-1188' })
    expect(resolve('reception.greeting', 'ja')).toBe('こんにちは')
    expect(resolve('reception.greeting', 'en')).toBe('Hello')
  })

  it('interpolates {phone} into static copy', () => {
    const resolve = createReceptionTextResolver({ messages, faqAnswers: {}, phone: '+81-3-5432-1188' })
    expect(resolve('reception.refusal.text', 'ja')).toBe('担当の施術者に直接ご確認ください。お電話：+81-3-5432-1188')
  })

  it('resolves faq.<slug> keys from the pre-fetched CMS answer map instead of messages', () => {
    const resolve = createReceptionTextResolver({
      messages,
      faqAnswers: { 'faq.clinic-hours': '9:00〜19:30' },
      phone: '+81-3-5432-1188',
    })
    expect(resolve('faq.clinic-hours', 'ja')).toBe('9:00〜19:30')
  })

  it('falls back to a "coming soon" message (with phone) when a faq slug has no active CMS entry', () => {
    const resolve = createReceptionTextResolver({ messages, faqAnswers: {}, phone: '+81-3-5432-1188' })
    expect(resolve('faq.clinic-parking', 'en')).toBe('Coming soon. Please call: +81-3-5432-1188')
  })

  it('falls back to the key itself when a static key is missing from messages entirely', () => {
    const resolve = createReceptionTextResolver({ messages, faqAnswers: {}, phone: '+81-3-5432-1188' })
    expect(resolve('reception.nonexistent.key', 'en')).toBe('reception.nonexistent.key')
  })
})

describe('createReceptionTextResolver — the AI answer key', () => {
  const phone = '+81-3-5432-1188'

  it('returns the host-supplied grounded answer when there is one', () => {
    const resolve = createReceptionTextResolver({
      messages,
      faqAnswers: {},
      phone,
      aiAnswer: () => '  現金とカードがご利用いただけます。  ',
    })
    expect(resolve(RECEPTION_AI_ANSWER_KEY, 'ja')).toBe('現金とカードがご利用いただけます。')
  })

  it('falls back to the fixed contact-us copy when the host has no answer — the default degradation', () => {
    for (const aiAnswer of [() => null, () => undefined, () => '', () => '   ', undefined]) {
      const resolve = createReceptionTextResolver({
        messages,
        faqAnswers: {},
        phone,
        ...(aiAnswer ? { aiAnswer } : {}),
      })
      expect(resolve(RECEPTION_AI_ANSWER_KEY, 'ja')).toBe('ご案内できませんでした。お電話ください：+81-3-5432-1188')
    }
  })

  it('reads the answer at call time, not at build time — it arrives after the resolver is built', () => {
    let current: string | null = null
    const resolve = createReceptionTextResolver({ messages, faqAnswers: {}, phone, aiAnswer: () => current })

    expect(resolve(RECEPTION_AI_ANSWER_KEY, 'en')).toContain("We couldn't answer that")
    current = 'Yes, we take credit cards.'
    expect(resolve(RECEPTION_AI_ANSWER_KEY, 'en')).toBe('Yes, we take credit cards.')
  })

  it('does not interpolate {phone} into model output', () => {
    const resolve = createReceptionTextResolver({
      messages,
      faqAnswers: {},
      phone,
      aiAnswer: () => 'Call {phone} to confirm.',
    })
    expect(resolve(RECEPTION_AI_ANSWER_KEY, 'en')).toBe('Call {phone} to confirm.')
  })
})
