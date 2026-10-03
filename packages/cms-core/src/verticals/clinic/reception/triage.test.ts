import { describe, expect, it } from 'vitest'
import { createClinicTriageResolver } from './triage'

// The composition, not the parts: faq-matcher.test.ts already covers matching
// against the real 36-entry faq-content.ts corpus, and screening.test.ts
// covers the screens. What matters here is the ORDER — medical first, so
// free text can reach refusal.medical at all.

const triage = createClinicTriageResolver('ja')

describe('createClinicTriageResolver', () => {
  it('refuses medical free text — the verdict that routes to the structural refusal node', () => {
    expect(triage('腰が痛いのですが何回くらいで治りますか', 'ja')).toEqual({ kind: 'refuse' })
  })

  it('refuses medical free text before trying to match it against an FAQ', () => {
    // Mentions parking, which would otherwise match faq.parking outright.
    expect(triage('駐車場から歩くと腰が痛いのですが平気ですか', 'ja')).toEqual({ kind: 'refuse' })
  })

  it('still routes a good static match to its FAQ node', () => {
    expect(triage('駐車場はありますか', 'ja')).toEqual({ kind: 'static', nodeId: 'faq.parking' })
  })

  it('routes a payment-method question to faq.prices — DIFFERENT from the old fixture corpus, which fell through to ai here', () => {
    // See faq-matcher.test.ts's "ambiguous phrasings" suite: faq-36's real
    // question ("健康保険は使えますか？") shares the literal phrase
    // "は使えますか" with this query, a legitimate (not spurious) overlap.
    expect(triage('クレジットカードは使えますか', 'ja')).toEqual({ kind: 'static', nodeId: 'faq.prices' })
  })

  it('does NOT refuse off-topic text — that is answered with its own fixed copy at the answer layer', () => {
    expect(triage('今日の天気はどうですか', 'ja')).toEqual({ kind: 'ai' })
  })
})
