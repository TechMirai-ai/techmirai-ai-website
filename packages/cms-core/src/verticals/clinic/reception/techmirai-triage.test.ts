import { describe, expect, it } from 'vitest'
import { MATCHED_ENTRIES } from './techmirai-chat-content'
import { createTechmiraiTriageResolver } from './techmirai-triage'

const en = createTechmiraiTriageResolver('en')
const ja = createTechmiraiTriageResolver('ja')

function route(resolver: typeof en, text: string, locale: 'en' | 'ja') {
  return resolver(text, locale)
}

describe('createTechmiraiTriageResolver — typing a FAQ question returns its answer', () => {
  const faqEntries = MATCHED_ENTRIES.filter((e) => e.question)

  it('covers F01–F26', () => {
    expect(faqEntries.map((e) => e.code)).toEqual(Array.from({ length: 26 }, (_, i) => `F${String(i + 1).padStart(2, '0')}`))
  })

  it.each(faqEntries.map((e) => [e.code, e] as const))('%s: its English question routes to it', (_code, entry) => {
    expect(route(en, entry.question!.en, 'en')).toEqual({ kind: 'static', nodeId: entry.id })
  })

  it.each(faqEntries.map((e) => [e.code, e] as const))('%s: its Japanese question routes to it', (_code, entry) => {
    expect(route(ja, entry.question!.ja, 'ja')).toEqual({ kind: 'static', nodeId: entry.id })
  })

  it('ignores case and trailing punctuation', () => {
    expect(route(en, 'how much does it cost', 'en')).toEqual({ kind: 'static', nodeId: 'f17' })
    expect(route(en, 'HOW MUCH DOES IT COST???', 'en')).toEqual({ kind: 'static', nodeId: 'f17' })
  })
})

describe('createTechmiraiTriageResolver — each entry is reachable by its keywords (36 entries)', () => {
  const keyworded = MATCHED_ENTRIES.filter((e) => e.keywords)

  it('covers F01–F26 and C01–C10', () => {
    expect(keyworded).toHaveLength(36)
  })

  // The first Spec keyword of each entry, typed on its own, lands on that entry.
  it.each(keyworded.map((e) => [e.code, e] as const))('%s: its first English keyword', (_code, entry) => {
    expect(route(en, entry.keywords!.en[0]!, 'en')).toEqual({ kind: 'static', nodeId: entry.id })
  })

  it.each(keyworded.map((e) => [e.code, e] as const))('%s: its first Japanese keyword', (_code, entry) => {
    expect(route(ja, entry.keywords!.ja[0]!, 'ja')).toEqual({ kind: 'static', nodeId: entry.id })
  })
})

describe('createTechmiraiTriageResolver — Spec §16.7 rows the matcher owns', () => {
  it.each([
    ['how much?', 'f17'],
    ['Can you do Korean?', 'f05'],
    ['Is the phone version ready?', 'f06'],
    ['Can you connect to my salon booking site?', 'f14'],
    ['Give me a 20% discount', 'c06'],
    ['My back hurts, what should I do?', 'f09'],
    ['Can I use a subsidy?', 'f20'],
    ['This is not working, I’m angry', 'c08'],
    ['Who founded TechMirai?', 'f23'],
  ])('en: "%s" -> %s', (question, nodeId) => {
    expect(route(en, question, 'en')).toEqual({ kind: 'static', nodeId })
  })

  it.each([
    ['いくらですか', 'f17'],
    ['韓国語は対応？', 'f05'],
    ['電話版はもう使える？', 'f06'],
    ['美容室の予約サイトと連携できる？', 'f14'],
    ['2割引きにして', 'c06'],
    ['人間ですか？', 'f08'],
    ['腰が痛い', 'f09'],
    ['補助金は使える？', 'f20'],
    ['全然動かない', 'c08'],
    ['代表は誰？', 'f23'],
  ])('ja: "%s" -> %s', (question, nodeId) => {
    expect(route(ja, question, 'ja')).toEqual({ kind: 'static', nodeId })
  })
})

describe('createTechmiraiTriageResolver — safety and edges', () => {
  it('routes symptom text to F09, never a clinical answer and never the AI', () => {
    expect(route(en, 'My shoulder hurts, can I still get treatment?', 'en')).toEqual({ kind: 'static', nodeId: 'f09' })
    expect(route(ja, '肩が痛いのですが', 'ja')).toEqual({ kind: 'static', nodeId: 'f09' })
  })

  it('does not let the product name alone trigger the "is this AI" answer', () => {
    expect(route(ja, 'AI受付とは', 'ja')).toEqual({ kind: 'static', nodeId: 'f01' })
    expect(route(en, 'What is AI受付', 'en')).toEqual({ kind: 'static', nodeId: 'f01' })
  })

  it('matches an ASCII keyword only as a whole word', () => {
    // "add" must not fire inside "address"; "address" is C04's own keyword.
    expect(route(en, 'What is your address?', 'en')).toEqual({ kind: 'static', nodeId: 'c04' })
  })

  it('treats a typographic apostrophe like a straight one', () => {
    expect(route(en, 'I don’t know', 'en')).toEqual(route(en, "I don't know", 'en'))
  })

  it('sends text that matches nothing to the AI, and empty text too', () => {
    expect(route(ja, 'ペットを連れて行っても良いですか', 'ja')).toEqual({ kind: 'ai' })
    expect(route(en, '   ', 'en')).toEqual({ kind: 'ai' })
  })
})
