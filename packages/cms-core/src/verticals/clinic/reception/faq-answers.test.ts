import { describe, expect, it } from 'vitest'
import { clinicReceptionFlow } from './flow'
import { buildStaticFaqAnswers } from './faq-answers'

describe('buildStaticFaqAnswers', () => {
  it('returns a non-empty answer for every one of the six faq nodes\' answerKey, in both locales', () => {
    const faqNodes = Object.values(clinicReceptionFlow.nodes).filter((n) => n.type === 'faq')
    expect(faqNodes).toHaveLength(6)

    const en = buildStaticFaqAnswers('en')
    const ja = buildStaticFaqAnswers('ja')
    for (const node of faqNodes) {
      expect(en[node.answerKey]?.trim()).toBeTruthy()
      expect(ja[node.answerKey]?.trim()).toBeTruthy()
    }
  })

  it('uses a single FAQ_CONTENT entry as-is for a node with only one mapped entry (parking: faq-29)', () => {
    const en = buildStaticFaqAnswers('en')
    expect(en['faq.clinic-parking']).toBe(
      'Parking availability depends on the clinic location. Please check our Access page or contact us for current parking information.',
    )
  })

  it('uses a single FAQ_CONTENT entry as-is for a node with only one mapped entry (bring: faq-10)', () => {
    const ja = buildStaticFaqAnswers('ja')
    expect(ja['faq.clinic-what-to-bring']).toBe(
      '必要な保険証などの書類がある場合はご持参ください。また、現在受けている治療や服用中のお薬がある場合は、分かる範囲でお知らせください。',
    )
  })

  it('combines two mapped entries for a two-entry node (hours: faq-31 + faq-32), dropping neither', () => {
    const en = buildStaticFaqAnswers('en')
    expect(en['faq.clinic-hours']).toContain('Our clinic is open')
    expect(en['faq.clinic-hours']).toContain('Please check our Access page or contact us directly to confirm hours around holidays.')
  })

  it('combines two mapped entries for a two-entry node (access: faq-33 + faq-34), dropping neither', () => {
    const ja = buildStaticFaqAnswers('ja')
    expect(ja['faq.clinic-access']).toContain('東京都世田谷区梅丘2-14-8 さくらビル1F')
    expect(ja['faq.clinic-access']).toContain('最寄り駅は梅丘駅')
  })

  it('combines two mapped entries for a two-entry node (prices: faq-35 + faq-36), dropping neither', () => {
    const en = buildStaticFaqAnswers('en')
    expect(en['faq.clinic-prices']).toContain('Treatment costs vary depending on the type of care')
    expect(en['faq.clinic-prices']).toContain('Please ask our staff for details specific to your situation')
  })

  it('combines two mapped entries for a two-entry node (first-visit: faq-05 + faq-06), dropping neither', () => {
    const en = buildStaticFaqAnswers('en')
    expect(en['faq.clinic-first-visit']).toContain('Please arrive a few minutes early')
    expect(en['faq.clinic-first-visit']).toContain('approximately 45–60 minutes')
  })

  it('joins multi-entry answers with a blank line, not concatenated run-on', () => {
    const en = buildStaticFaqAnswers('en')
    expect(en['faq.clinic-hours']).toContain('\n\n')
  })

  it('falls back to English for a non-ja locale', () => {
    const answers = buildStaticFaqAnswers('bn')
    expect(answers['faq.clinic-parking']).toBe(buildStaticFaqAnswers('en')['faq.clinic-parking'])
  })
})
