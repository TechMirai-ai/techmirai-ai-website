import { describe, expect, it } from 'vitest'
import {
  ALL_ENTRIES,
  BUTTON_LABELS,
  buildTechmiraiMessages,
  CHAT_GREETING,
  CHAT_INPUT_HINT,
  CHAT_TALK_TO_PERSON,
  CHAT_WIDGET_TITLE,
  getEntry,
  MATCHED_ENTRIES,
  MENU_BUTTON_IDS,
} from './techmirai-chat-content'

describe('TechMirai chat content (Spec §16.1–16.3)', () => {
  it('has exactly the 36 matched answers F01–F26 and C01–C10, once each', () => {
    const expected = [
      ...Array.from({ length: 26 }, (_, i) => `F${String(i + 1).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`),
    ]
    expect(MATCHED_ENTRIES.map((e) => e.code)).toEqual(expected)
  })

  it('has the six menu buttons and the Spec sub-buttons', () => {
    expect(MENU_BUTTON_IDS).toEqual(['b1', 'b2', 'b3', 'b4', 'b5', 'b6'])
    for (const id of ['b1a', 'b1b', 'b4-clinic', 'b4-beauty', 'b4-auto', 'b4-hotel', 'b4-other']) {
      expect(getEntry(id), id).toBeDefined()
    }
  })

  it('has unique node ids', () => {
    const ids = ALL_ENTRIES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never leaves an English or Japanese answer empty', () => {
    for (const entry of ALL_ENTRIES) {
      expect(entry.answer.en.trim(), `${entry.code} en`).not.toBe('')
      expect(entry.answer.ja.trim(), `${entry.code} ja`).not.toBe('')
      if (entry.label) {
        expect(entry.label.en.trim(), `${entry.code} label en`).not.toBe('')
        expect(entry.label.ja.trim(), `${entry.code} label ja`).not.toBe('')
      }
    }
  })

  it('gives every matched entry English and Japanese keywords', () => {
    for (const entry of MATCHED_ENTRIES) {
      expect(entry.keywords?.en.length, `${entry.code} en keywords`).toBeGreaterThan(0)
      expect(entry.keywords?.ja.length, `${entry.code} ja keywords`).toBeGreaterThan(0)
    }
  })

  it('points every "next button" at a node or label that exists', () => {
    for (const entry of ALL_ENTRIES) {
      for (const button of entry.next) {
        if (button.kind === 'node') expect(getEntry(button.to), `${entry.code} -> ${button.to}`).toBeDefined()
        else expect(BUTTON_LABELS[button.label], `${entry.code} label ${button.label}`).toBeDefined()
      }
    }
  })

  it('keeps Spec-bracketed facts in brackets, never filled in', () => {
    expect(getEntry('b3')!.answer.en).toContain('[¥300,000]')
    expect(getEntry('b3')!.answer.ja).toContain('[30万円]')
    expect(getEntry('b6')!.answer.en).toContain('[on weekdays 9:00–18:00]')
    expect(getEntry('f19')!.answer).toEqual({ en: '[CONFIRM]', ja: '[確認中]' })
    expect(getEntry('f12')!.answer.en).toContain('[X weeks]')
    expect(getEntry('c04')!.answer.en).toContain('[Published address]')
  })

  it('omits the unconfirmed in-person sentence from F25 (decision D-5)', () => {
    const f25 = getEntry('f25')!.answer
    expect(f25.en).toBe('Online consultations anywhere in Japan.')
    expect(f25.en).not.toMatch(/in-person|visit/i)
    expect(f25.ja).not.toContain('訪問')
  })

  it('writes [JA TODO] — never a guess — for the button labels the Spec gives no Japanese for', () => {
    const todo = Object.entries(BUTTON_LABELS)
      .filter(([, label]) => label.ja === '[JA TODO]')
      .map(([name]) => name)
    // docs/PLACEHOLDER-REGISTER.md K1-01 lists exactly these.
    expect(todo.sort()).toEqual(
      [
        'aboutPage',
        'autoPage',
        'beautyPage',
        'brochure',
        'contact',
        'contactPage',
        'hotelPage',
        'integrationsPage',
        'privacyPolicy',
        'securityPage',
        'securitySupportPage',
      ].sort(),
    )
  })

  it('carries the Spec §16.1 greeting, tag text sources and always-visible link', () => {
    expect(CHAT_WIDGET_TITLE).toBe('TechMirai AI受付')
    expect(CHAT_GREETING.en).toContain('an automated assistant')
    expect(CHAT_GREETING.ja).toContain('自動応答')
    expect(CHAT_INPUT_HINT).toEqual({ en: 'Or type your question below.', ja: 'ご質問は、下の欄に入力することもできます。' })
    expect(CHAT_TALK_TO_PERSON).toEqual({ en: 'Talk to a person', ja: 'スタッフと話す' })
  })

  it.each(['en', 'ja'] as const)('builds a resolvable message tree for %s', (locale) => {
    const tree = buildTechmiraiMessages(locale) as { tm: Record<string, { answer?: string }> }
    for (const entry of ALL_ENTRIES) {
      expect(tree.tm[entry.id]?.answer, `${entry.code} ${locale}`).toBe(entry.answer[locale])
    }
  })
})
