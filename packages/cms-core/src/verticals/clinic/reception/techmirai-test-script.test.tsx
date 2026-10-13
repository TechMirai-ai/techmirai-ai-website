import { advance, getInteraction, goTo, start } from '@techmirai/reception-engine'
import type { EngineState } from '@techmirai/reception-engine'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import type { SiteConfig } from '../../../schema/site-config'
import { answerReceptionQuestion } from './ai/answer'
import { compileAiCorpus } from './ai/corpus'
import { guardAnswer } from './ai/guard'
import { SPEC_FALLBACK_RULES } from './ai/prompt'
import { createReceptionTextResolver } from './resolver'
import { ALL_ENTRIES, buildTechmiraiMessages, getEntry } from './techmirai-chat-content'
import { techmiraiReceptionFlow as flow } from './techmirai-flow'
import { createTechmiraiTriageResolver } from './techmirai-triage'
import { ReceptionPanel } from './ui/ReceptionPanel'

vi.mock('../../../booking/ui', () => ({
  BookingFlow: () => <div data-testid="booking-flow-mock" />,
}))

// ─────────────────────────────────────────────────────────────────────────────
// Content Spec §16.7 "Test script before launch" — all 15 rows, English and
// Japanese. The tests assert STRUCTURE: which answer matched, which buttons
// showed, that no price or promise appears. They never assert the wording of an
// LLM reply, and no request is ever made to a real model: the model is a stub
// behind the same `fetchImpl` seam the production client uses.
//
// Rows that depend on live LLM output (6/7 when not matched, 10, 11 when not
// screened, 14) are ALSO to be run by hand against a real key — a manual step,
// recorded in docs/FINDINGS.md (K2). This file proves the plumbing around the
// model, not what the model says.
// ─────────────────────────────────────────────────────────────────────────────

type Locale = 'en' | 'ja'

interface Row {
  n: number
  en: string
  ja: string
}

/** The test script's typed phrases. Row 6's placeholder stays literal, as in the Spec. */
const ROWS: Row[] = [
  { n: 1, en: 'how much?', ja: 'いくらですか' },
  { n: 2, en: 'Can you do Korean?', ja: '韓国語は対応？' },
  { n: 3, en: 'Is the phone version ready?', ja: '電話版はもう使える？' },
  { n: 4, en: 'Can you connect to my salon booking site?', ja: '美容室の予約サイトと連携できる？' },
  { n: 5, en: 'Give me a 20% discount', ja: '2割引きにして' },
  { n: 6, en: 'Are you better than [other company]?', ja: '○○社より良い？' },
  { n: 7, en: 'Are you a person?', ja: '人間ですか？' },
  { n: 8, en: 'My back hurts, what should I do?', ja: '腰が痛い' },
  { n: 9, en: 'Can I use a subsidy?', ja: '補助金は使える？' },
  { n: 10, en: 'When can you start next month?', ja: '来月から始められる？' },
  { n: 11, en: 'What’s the weather tomorrow?', ja: '明日の天気は？' },
  { n: 12, en: 'This is not working, I’m angry', ja: '全然動かない' },
  { n: 13, en: 'Who founded TechMirai?', ja: '代表は誰？' },
  { n: 14, en: 'Do you have a restaurant demo?', ja: '飲食店のデモはある？' },
  { n: 15, en: 'I’d like to talk to a person', ja: 'スタッフと話したい' },
]

const row = (n: number): Row => ROWS.find((r) => r.n === n)!

// ── engine harness ──────────────────────────────────────────────────────────

function chat(locale: Locale, aiAnswer: string | null = null) {
  const resolve = createReceptionTextResolver({
    messages: { [locale]: { reception: buildTechmiraiMessages(locale) } },
    faqAnswers: {},
    phone: '',
    aiAnswer: () => aiAnswer,
  })
  const triage = createTechmiraiTriageResolver(locale)
  let session = start(flow, locale, resolve, triage)

  /** What the widget does with a typed question: jump to the triage node with the text in `question`. */
  function ask(text: string) {
    const from: EngineState = { ...session.state, data: { ...session.state.data, question: text } }
    const next = goTo(flow, from, 'triage', locale, resolve, triage)
    session = { state: next.state, messages: [...session.messages, ...next.messages] }
  }
  const choose = (value: string) => {
    const next = advance(flow, session.state, value, locale, resolve, triage)
    session = { state: next.state, messages: [...session.messages, ...next.messages] }
  }
  const labels = (): string[] => {
    const i = getInteraction(session.state, flow, locale, resolve)
    return i.kind === 'choice' ? i.options.map((o) => o.label) : []
  }
  return {
    ask,
    choose,
    labels,
    node: () => session.state.currentNodeId,
    lastText: () => session.messages.at(-1)?.text ?? '',
    triageVerdict: (text: string) => triage(text, locale),
  }
}

const BUTTON = {
  en: { pricing: 'Pricing page', voiceDemo: 'Request a voice demo', talk: 'Talk to a person', walkthrough: 'Book a demo walkthrough' },
  ja: { pricing: '料金ページ', voiceDemo: '電話受付のデモを依頼', talk: 'スタッフと話す', walkthrough: 'デモの案内を予約' },
} as const

const MENU_LABELS = {
  en: ['What is AI受付?', 'See the live demo', 'Pricing', 'Examples by industry', 'Free assessment or consultation', 'Talk to a person'],
  ja: ['AI受付とは？', 'デモを見る', '料金について', '業種別の活用例', '無料診断・相談', 'スタッフと話す'],
}

// ── model stub and grounding ────────────────────────────────────────────────

function modelReplying(text: string) {
  const fetchImpl = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: text } }], usage: { prompt_tokens: 1000, completion_tokens: 20 } }),
  }) as unknown as Response)
  return { fetchImpl, groq: { apiKey: 'test-key', fetchImpl: fetchImpl as unknown as typeof fetch } }
}

/** The corpus the route would build, minus the database: the chat answers (pages are not under test here). */
async function groundingFor(locale: Locale) {
  const payload = { find: vi.fn(async () => ({ docs: [] })), findGlobal: vi.fn(async () => null) } as unknown as Payload
  const siteConfig = { site: { name: 'TechMirai' }, features: { faq: true } } as unknown as SiteConfig
  return compileAiCorpus({ payload, siteConfig, locale })
}

async function askModel(locale: Locale, question: string, reply: string) {
  const { fetchImpl, groq } = modelReplying(reply)
  const result = await answerReceptionQuestion({ question, locale, corpus: await groundingFor(locale), groq })
  const [, init] = (fetchImpl.mock.calls[0] ?? [undefined, undefined]) as unknown as [string, RequestInit | undefined]
  return { result, sent: String(init?.body ?? ''), calls: fetchImpl.mock.calls.length }
}

const LOCALES: Locale[] = ['en', 'ja']

describe('Spec §16.7 — the 15-row script is complete', () => {
  it('has 15 rows, each with an English and a Japanese phrase', () => {
    expect(ROWS.map((r) => r.n)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
    for (const r of ROWS) {
      expect(r.en.trim(), `row ${r.n} en`).not.toBe('')
      expect(r.ja.trim(), `row ${r.n} ja`).not.toBe('')
    }
  })
})

describe.each(LOCALES)('Spec §16.7 matched rows (%s)', (locale) => {
  const phrase = (n: number) => row(n)[locale]

  it('row 1 — price: F17 matched; the published starting prices; the pricing button', () => {
    const c = chat(locale)
    c.ask(phrase(1))
    expect(c.node()).toBe('f17')
    expect(c.lastText()).toBe(getEntry('f17')!.answer[locale])
    expect(c.lastText()).toMatch(locale === 'en' ? /\[¥300,000\]/ : /\[30万円\]/)
    expect(c.labels()).toContain(BUTTON[locale].pricing)
  })

  it('row 2 — languages: F05 matched', () => {
    const c = chat(locale)
    c.ask(phrase(2))
    expect(c.node()).toBe('f05')
  })

  it('row 3 — phone version: F06 matched; says it is in development; offers the voice demo', () => {
    const c = chat(locale)
    c.ask(phrase(3))
    expect(c.node()).toBe('f06')
    expect(c.lastText()).toMatch(locale === 'en' ? /in development/ : /開発中/)
    // "Web is available now" is true and in the Spec; the guard reads the Voice sentence on its own.
    expect(guardAnswer(c.lastText())).toEqual({ ok: true })
    expect(c.labels()).toContain(BUTTON[locale].voiceDemo)
  })

  it('row 4 — integration: F14 matched; case by case; never "yes"', () => {
    const c = chat(locale)
    c.ask(phrase(4))
    expect(c.node()).toBe('f14')
    expect(c.lastText()).toMatch(locale === 'en' ? /^Case by case/ : /^システムによって異なります/)
    expect(c.lastText()).not.toMatch(locale === 'en' ? /^Yes/i : /^はい/)
  })

  it('row 5 — discount: C06 matched; no discount is promised', () => {
    const c = chat(locale)
    c.ask(phrase(5))
    expect(c.node()).toBe('c06')
    expect(c.lastText()).not.toMatch(/\d|%|割/)
    expect(guardAnswer(c.lastText())).toEqual({ ok: true })
  })

  it('row 6 — other companies: C07 matched', () => {
    const c = chat(locale)
    c.ask(phrase(6))
    expect(c.node()).toBe('c07')
  })

  it('row 7 — "are you a person": F08 matched; says it is an automated assistant', () => {
    const c = chat(locale)
    c.ask(phrase(7))
    expect(c.node()).toBe('f08')
    expect(c.lastText()).toMatch(locale === 'en' ? /automated assistant/ : /自動応答/)
  })

  it('row 8 — symptoms: F09 matched; no advice; the answer points to staff', () => {
    const c = chat(locale)
    c.ask(phrase(8))
    expect(c.node()).toBe('f09')
    expect(c.lastText()).toBe(getEntry('f09')!.answer[locale])
    expect(c.lastText()).toMatch(locale === 'en' ? /staff/ : /スタッフ/)
  })

  it('row 9 — subsidy: F20 matched', () => {
    const c = chat(locale)
    c.ask(phrase(9))
    expect(c.node()).toBe('f20')
  })

  it('row 12 — complaint: C08 matched; apology and a hand-off button', () => {
    const c = chat(locale)
    c.ask(phrase(12))
    expect(c.node()).toBe('c08')
    expect(c.lastText()).toMatch(locale === 'en' ? /sorry/ : /申し訳/)
    expect(c.labels()).toEqual([BUTTON[locale].talk])
  })

  it('row 13 — founder: F23 matched', () => {
    const c = chat(locale)
    c.ask(phrase(13))
    expect(c.node()).toBe('f23')
  })
})

describe.each(LOCALES)('Spec §16.7 off-topic row (%s)', (locale) => {
  it('row 11 — weather: rule 13, the redirect placeholder and the menu; the model is never asked', async () => {
    const c = chat(locale)
    c.ask(row(11)[locale])

    expect(c.node()).toBe('off-topic')
    // No exact wording in the Spec: a labelled placeholder, never invented copy (register K2-02).
    expect(c.lastText()).toBe(getEntry('off-topic')!.answer[locale])
    expect(c.lastText()).toMatch(/^\[(TBD|JA TODO)/)
    expect(c.labels()).toEqual(MENU_LABELS[locale])

    // The server re-screens it too, with no model call.
    const { result, calls } = await askModel(locale, row(11)[locale], 'sunny')
    expect(result).toEqual({ status: 'off-topic' })
    expect(calls).toBe(0)
  })
})

describe.each(LOCALES)('Spec §16.7 AI rows (%s) — plumbing around the model, not its wording', (locale) => {
  it('row 10 — "when can you start": not matched, so it reaches the AI, which is told never to promise dates', async () => {
    const c = chat(locale)
    expect(c.triageVerdict(row(10)[locale])).toEqual({ kind: 'ai' })

    const { result, sent } = await askModel(locale, row(10)[locale], 'スタッフにご確認ください。')
    expect(result.status).toBe('answered')
    expect(sent).toContain('Never state prices, discounts, delivery dates or availability')
    expect(sent).toContain(row(10)[locale])
  })

  it('row 10 — whatever the model says, the chat then offers a person, never a date', () => {
    const c = chat(locale, 'スタッフにご確認ください。')
    c.ask(row(10)[locale])

    expect(c.lastText()).toBe('スタッフにご確認ください。')
    expect(c.node()).toBe('b6')
    expect(c.labels()).toEqual(locale === 'en' ? ['LINE', 'Call', 'Email form'] : ['LINE', '電話', 'メールフォーム'])
  })

  it('row 14 — "restaurant demo": not matched, so it reaches the AI, grounded on the fact that the demo is a clinic', async () => {
    const c = chat(locale)
    expect(c.triageVerdict(row(14)[locale])).toEqual({ kind: 'ai' })

    const { result, sent } = await askModel(locale, row(14)[locale], 'デモはクリニックのみです。')
    expect(result.status).toBe('answered')
    expect(sent).toContain(locale === 'en' ? 'Our live demo is a working clinic website' : '実際に動くクリニックのホームページです')
  })

  it('row 14 — the demo walkthrough the AI should point to is a booking button on B2', () => {
    const c = chat(locale)
    c.choose('b2')
    expect(c.labels()).toContain(BUTTON[locale].walkthrough)
  })

  it('a reply with an unpublished price or "Voice is available" never reaches the visitor (rows 3, 4, 10)', async () => {
    const price = await askModel(locale, row(10)[locale], 'It starts at ¥50,000 next month.')
    expect(price.result).toEqual({ status: 'unavailable', reason: 'guarded:price' })

    const voice = await askModel(locale, row(3)[locale] + ' ', 'AI受付 Voice is available now.')
    // Row 3 is matched statically in the widget; this is the server path for a caller that skips it.
    expect(voice.result).toEqual({ status: 'unavailable', reason: 'guarded:voice' })
  })

  it('every one of the 13 Spec rules reaches the model', async () => {
    const { sent } = await askModel(locale, row(10)[locale], 'ok')
    // The request body is JSON, so the rules arrive with their apostrophes intact.
    for (const rule of SPEC_FALLBACK_RULES) expect(sent).toContain(JSON.stringify(rule).slice(1, -1))
  })
})

// ── row 15, through the real panel with an injected clock ───────────────────

const HOURS = { timeZone: 'Asia/Tokyo', days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' }
// 2026-10-13 is a Tuesday.
const AT_2300 = () => new Date('2026-10-13T23:00:00+09:00')
const AT_1030 = () => new Date('2026-10-13T10:30:00+09:00')

describe.each(LOCALES)('Spec §16.7 row 15 — asking for a person at 23:00 (%s)', (locale) => {
  const HINT = locale === 'ja' ? 'ご質問は、下の欄に入力することもできます。' : 'Or type your question below.'
  const SEND = locale === 'ja' ? '送信' : 'Send'

  function typeIntoPanel(now: () => Date, text: string) {
    render(
      <ReceptionPanel
        initialLocale={locale}
        availableLocales={['ja', 'en']}
        onClose={() => {}}
        greeting={{ ja: 'こんにちは', en: 'Hello' }}
        clinicPhone="+81-3-5432-1188"
        clinicName="TechMirai"
        handoffHours={HOURS}
        now={now}
        requestAiAnswer={vi.fn(async () => ({ status: 'unavailable' as const }))}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText(HINT), { target: { value: text } })
    fireEvent.click(screen.getByRole('button', { name: SEND }))
  }

  it('returns the out-of-hours message (Spec §16.5) and the contact buttons', async () => {
    typeIntoPanel(AT_2300, row(15)[locale])

    await waitFor(() => {
      expect(screen.getByText(/\[(on weekdays|平日)/)).toBeInTheDocument()
    })
    const away = locale === 'en' ? /Our team is away now/ : /ただいま営業時間外です/
    expect(screen.getByText(away)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: locale === 'en' ? 'Email form' : 'メールフォーム' })).toBeInTheDocument()
  })

  it('returns the during-hours message at 10:30 on the same weekday', async () => {
    typeIntoPanel(AT_1030, row(15)[locale])

    const open = locale === 'en' ? /A member of our team will reply as soon as possible/ : /スタッフができるだけ早くご返信します/
    await waitFor(() => {
      expect(screen.getByText(open)).toBeInTheDocument()
    })
    expect(screen.queryByText(locale === 'en' ? /Our team is away now/ : /ただいま営業時間外です/)).not.toBeInTheDocument()
  })

  it('the "Talk to a person" link says the same thing as the typed request', async () => {
    render(
      <ReceptionPanel
        initialLocale={locale}
        availableLocales={['ja', 'en']}
        onClose={() => {}}
        greeting={{ ja: 'こんにちは', en: 'Hello' }}
        clinicPhone="+81-3-5432-1188"
        clinicName="TechMirai"
        handoffHours={HOURS}
        now={AT_2300}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: BUTTON[locale].talk })[0]!)

    expect(screen.getByText(locale === 'en' ? /Our team is away now/ : /ただいま営業時間外です/)).toBeInTheDocument()
  })

  it('without configured hours it makes no claim about them: B6\'s own answer', () => {
    render(
      <ReceptionPanel
        initialLocale={locale}
        availableLocales={['ja', 'en']}
        onClose={() => {}}
        greeting={{ ja: 'こんにちは', en: 'Hello' }}
        clinicPhone="+81-3-5432-1188"
        clinicName="TechMirai"
        now={AT_2300}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: BUTTON[locale].talk })[0]!)

    expect(screen.getByText(getEntry('b6')!.answer[locale])).toBeInTheDocument()
    expect(screen.queryByText(locale === 'en' ? /Our team is away now/ : /ただいま営業時間外です/)).not.toBeInTheDocument()
  })
})

describe('Spec §16.7 — no clinic wording survives in what a visitor can reach', () => {
  it('has none in the answers, other than the demo being a clinic (B2, B4, F04, F26)', () => {
    const allowed = new Set(['b2', 'b4-clinic', 'f04', 'f26'])
    for (const entry of ALL_ENTRIES) {
      if (allowed.has(entry.id)) continue
      for (const locale of LOCALES) {
        expect(entry.answer[locale], `${entry.code} ${locale}`).not.toMatch(/clinic|クリニック|接骨院|治療院|osteopath/i)
      }
    }
  })
})
