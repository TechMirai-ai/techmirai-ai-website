import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { buildStaticFaqAnswers } from '../../faq-answers'
import { ReceptionPanel } from '../ReceptionPanel'
import type { RequestReceptionAiAnswer } from '../ai-client'
import type { ReceptionAiResponse } from '../../ai-contract'

vi.mock('../../../../../booking/ui', () => ({
  BookingFlow: ({ clinicName }: { clinicName: string }) => <div data-testid="booking-flow-mock">{clinicName}</div>,
}))

const defaultProps = {
  initialLocale: 'ja',
  availableLocales: ['ja', 'en'],
  onClose: () => {},
  greeting: { ja: 'こんにちは', en: 'Hello' },
  clinicPhone: '+81-3-5432-1188',
  clinicName: 'さくら接骨院',
  faqAnswers: { ja: {}, en: {} },
}

describe('ReceptionPanel', () => {
  it('mounts BookingFlow inline when 予約したい is chosen', () => {
    render(<ReceptionPanel {...defaultProps} />)

    fireEvent.click(screen.getByText('予約したい'))

    expect(screen.getByTestId('booking-flow-mock')).toHaveTextContent('さくら接骨院')
  })

  it('renders a link to the manage page when 予約の変更・キャンセル is chosen', () => {
    render(<ReceptionPanel {...defaultProps} />)

    fireEvent.click(screen.getByText('予約の変更・キャンセル'))

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/ja/booking/manage')
  })

  it('shows the fixed refusal message with the clinic phone number for "other" questions, never a clinical answer', () => {
    render(<ReceptionPanel {...defaultProps} />)

    fireEvent.click(screen.getByText('質問がある'))
    fireEvent.click(screen.getByText('症状・施術についてのご質問'))

    expect(screen.getByText(/担当の施術者に直接ご確認ください/)).toBeInTheDocument()
    expect(screen.getByText(/\+81-3-5432-1188/)).toBeInTheDocument()
  })

  it('renders the config-supplied greeting override instead of the built-in default', () => {
    render(<ReceptionPanel {...defaultProps} greeting={{ ja: 'いらっしゃいませ！', en: 'Welcome!' }} />)
    expect(screen.getByText('いらっしゃいませ！')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// "Talk to staff" LINE link (part 5) — plain outbound link, not lead-saving.
// ─────────────────────────────────────────────────────────────────────────────

describe('ReceptionPanel — talk to staff (faq.staff)', () => {
  const STAFF_LINE_URL = 'https://line.me/R/ti/p/@sakura-sekkotsu-placeholder'

  it('renders an external LINE link, opened in a new tab, when staffLineUrl is configured', () => {
    render(<ReceptionPanel {...defaultProps} staffLineUrl={STAFF_LINE_URL} />)

    fireEvent.click(screen.getByText('質問がある'))
    fireEvent.click(screen.getByText('LINEでスタッフに相談する'))

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', STAFF_LINE_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('hides the option entirely — never a dead/broken button — when staffLineUrl is unset', () => {
    render(<ReceptionPanel {...defaultProps} />)

    fireEvent.click(screen.getByText('質問がある'))

    expect(screen.queryByText('LINEでスタッフに相談する')).not.toBeInTheDocument()
  })

  it('also hides the option when staffLineUrl is an empty/whitespace string', () => {
    render(<ReceptionPanel {...defaultProps} staffLineUrl="   " />)

    fireEvent.click(screen.getByText('質問がある'))

    expect(screen.queryByText('LINEでスタッフに相談する')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Free-text (faq.ask) — the composer itself, and the four things that can
// come back from it. The Groq call is never made here: `requestAiAnswer` is
// the injected seam standing in for POST /api/reception/ai, and the two
// screening layers are exercised by asserting it is NOT called.
// ─────────────────────────────────────────────────────────────────────────────

const ASK_PLACEHOLDER = 'ご質問を入力してください。お答えできる範囲でご案内します。'
const SEND = { name: '送信' }
// Nothing the six FAQ menu topics cover, and nothing either screen catches
// — falls through to the AI node. NOT 'クレジットカードは使えますか': that
// used to be this clean ai-fallback case, but after the FAQ content
// replacement (faq-content.ts) it now static-matches faq.prices, since
// faq-36's real question ("健康保険は使えますか？") shares the literal
// phrase "は使えますか" with it — see faq-matcher.test.ts's "ambiguous
// phrasings" suite for the full explanation.
const CLINIC_QUESTION = 'ペットを連れて行っても良いですか'

describe('ReceptionPanel — free-text input (faq.ask)', () => {
  function atFreeTextInput(requestAiAnswer?: RequestReceptionAiAnswer) {
    render(<ReceptionPanel {...defaultProps} {...(requestAiAnswer ? { requestAiAnswer } : {})} />)
    fireEvent.click(screen.getByText('質問がある'))
    fireEvent.click(screen.getByText('質問を入力する'))
  }

  function ask(text: string) {
    fireEvent.change(screen.getByPlaceholderText(ASK_PLACEHOLDER), { target: { value: text } })
    fireEvent.click(screen.getByRole('button', SEND))
  }

  it('renders a text input with the resolved faq.ask prompt as its placeholder — never a raw key', () => {
    atFreeTextInput()

    const input = screen.getByPlaceholderText(ASK_PLACEHOLDER)
    expect(input).toBeInTheDocument()
    expect(input).not.toBeDisabled()
  })

  it('disables the submit button while the draft is empty', () => {
    atFreeTextInput()

    expect(screen.getByRole('button', SEND)).toBeDisabled()
  })

  it('enables the submit button once the user types something', () => {
    atFreeTextInput()

    fireEvent.change(screen.getByPlaceholderText(ASK_PLACEHOLDER), { target: { value: CLINIC_QUESTION } })
    expect(screen.getByRole('button', SEND)).not.toBeDisabled()
  })

  it('disables the input and submit button while the answer is in flight', async () => {
    let release: (value: ReceptionAiResponse) => void = () => {}
    const pending = new Promise<ReceptionAiResponse>((resolve) => {
      release = resolve
    })
    atFreeTextInput(() => pending)

    ask(CLINIC_QUESTION)

    // The real pending window now: the request is out and unresolved.
    expect(screen.getByRole('button', SEND)).toBeDisabled()

    release({ status: 'answered', answer: '現金とクレジットカードがご利用いただけます。' })
    await waitFor(() => {
      expect(screen.getByText('現金とクレジットカードがご利用いただけます。')).toBeInTheDocument()
    })
  })

  it('shows the grounded answer, then returns to the button menu — one answer, not a chat', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: '土曜日は13時まで受付しております。' }))
    atFreeTextInput(requestAiAnswer)

    ask(CLINIC_QUESTION)

    await waitFor(() => {
      expect(screen.getByText('土曜日は13時まで受付しております。')).toBeInTheDocument()
    })
    expect(requestAiAnswer).toHaveBeenCalledWith({ question: CLINIC_QUESTION, locale: 'ja' })
    // The submitted question renders as its own bubble; the composer is gone.
    expect(screen.getByText(CLINIC_QUESTION)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(ASK_PLACEHOLDER)).not.toBeInTheDocument()
    expect(screen.getByText('営業時間')).toBeInTheDocument()
  })

  it('degrades to the fixed contact-us copy when the answer is unavailable — never an error, never an empty bubble', async () => {
    atFreeTextInput(async () => ({ status: 'unavailable' }))

    ask(CLINIC_QUESTION)

    await waitFor(() => {
      expect(screen.getByText(/ただいま自動でのご案内ができませんでした/)).toBeInTheDocument()
    })
    expect(screen.getByText(/\+81-3-5432-1188/)).toBeInTheDocument()
    expect(screen.getByText('営業時間')).toBeInTheDocument()
  })

  it('answers an off-topic question from fixed copy without ever calling the server', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: '晴れです' }))
    atFreeTextInput(requestAiAnswer)

    ask('今日の天気はどうですか')

    await waitFor(() => {
      expect(screen.getByText(/当院のご利用に関するご質問のみお答えしております/)).toBeInTheDocument()
    })
    expect(requestAiAnswer).not.toHaveBeenCalled()
    expect(screen.queryByText('晴れです')).not.toBeInTheDocument()
  })

  it('routes a medical free-text question to the refusal node without ever calling the server', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: '3回で治ります' }))
    atFreeTextInput(requestAiAnswer)

    ask('腰が痛いのですが何回くらいで良くなりますか')

    await waitFor(() => {
      expect(screen.getByText(/担当の施術者に直接ご確認ください/)).toBeInTheDocument()
    })
    expect(requestAiAnswer).not.toHaveBeenCalled()
    expect(screen.queryByText('3回で治ります')).not.toBeInTheDocument()
  })

  it('does not advance the flow on an empty submission — the required validator on faq.ask is respected', () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'unavailable' as const }))
    const { container } = render(<ReceptionPanel {...defaultProps} requestAiAnswer={requestAiAnswer} />)
    fireEvent.click(screen.getByText('質問がある'))
    fireEvent.click(screen.getByText('質問を入力する'))

    const messageCountBefore = container.querySelectorAll('[class*="rounded-2xl"][class*="px-3.5"]').length

    // Bypass the disabled submit button to exercise submitFreeText's own
    // guard directly, not just the disabled attribute.
    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(screen.getByPlaceholderText(ASK_PLACEHOLDER)).toBeInTheDocument()
    expect(container.querySelectorAll('[class*="rounded-2xl"][class*="px-3.5"]').length).toBe(messageCountBefore)
    expect(requestAiAnswer).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The six FAQ menu buttons (hours/access/parking/prices/bring/first-visit) —
// wired directly to faq-content.ts. Before this, `faqAnswers` was always {}
// in practice (the CMS-backed resolveClinicFaqAnswers never had seeded
// content for these slugs — see the delivery report), so every button
// rendered the "not ready yet, please call us" fallback regardless of props.
// These tests use the REAL buildStaticFaqAnswers output, not a stub, so a
// regression back to an empty/missing key shows up as the fallback message
// reappearing, exactly like the bug Jamal reported.
// ─────────────────────────────────────────────────────────────────────────────

const REAL_FAQ_ANSWERS = { ja: buildStaticFaqAnswers('ja'), en: buildStaticFaqAnswers('en') }
const FALLBACK_SNIPPET = { ja: '現在準備中です', en: "isn't ready yet" }

describe('ReceptionPanel — the six FAQ menu buttons now show real content, not the CMS fallback', () => {
  function openFaqMenu(locale: 'ja' | 'en') {
    render(<ReceptionPanel {...defaultProps} initialLocale={locale} faqAnswers={REAL_FAQ_ANSWERS} />)
    fireEvent.click(screen.getByText(locale === 'ja' ? '質問がある' : 'Ask a question'))
  }

  it.each([
    ['営業時間', /診療時間は/],
    ['アクセス', /梅丘|世田谷区/],
    ['駐車場', /アクセス.*ページ/],
    ['料金', /施術内容/],
    ['持ち物', /保険証/],
    ['初診の流れ', /問診|45.?.?60分/],
  ])('ja: tapping "%s" shows the real faq-content.ts answer, not the fallback', (buttonLabel, expectedSnippet) => {
    openFaqMenu('ja')
    fireEvent.click(screen.getByText(buttonLabel))

    expect(screen.queryByText(new RegExp(FALLBACK_SNIPPET.ja))).not.toBeInTheDocument()
    expect(screen.getByText(expectedSnippet)).toBeInTheDocument()
  })

  it.each([
    ['Business hours', /open/i],
    ['Access / directions', /Access page/i],
    ['Parking', /Access page/i],
    ['Prices', /insurance/i],
    ['What to bring', /identification|insurance documents/i],
    ['What to expect at your first visit', /45.?.?60 minutes|arrive a few minutes/i],
  ])('en: tapping "%s" shows the real faq-content.ts answer, not the fallback', (buttonLabel, expectedSnippet) => {
    openFaqMenu('en')
    fireEvent.click(screen.getByText(buttonLabel))

    expect(screen.queryByText(new RegExp(FALLBACK_SNIPPET.en, 'i'))).not.toBeInTheDocument()
    expect(screen.getByText(expectedSnippet)).toBeInTheDocument()
  })

  it('ja: "hours" combines BOTH mapped entries (faq-31 + faq-32) — neither is dropped', () => {
    openFaqMenu('ja')
    fireEvent.click(screen.getByText('営業時間'))

    // faq-31 (general hours) and faq-32 (Sundays/holidays) are different
    // sentences — both must appear, not just whichever was written first.
    expect(screen.getByText(/診療時間は/)).toBeInTheDocument()
    expect(screen.getByText(/日曜日・祝日の診療については/)).toBeInTheDocument()
  })

  it('tapping "Prices" and typing "how much does it cost?" give materially the same answer — both read faq-content.ts now', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: 'AI FALLBACK — SHOULD NOT BE USED' }))
    render(<ReceptionPanel {...defaultProps} faqAnswers={REAL_FAQ_ANSWERS} requestAiAnswer={requestAiAnswer} />)

    fireEvent.click(screen.getByText('質問がある'))
    fireEvent.click(screen.getByText('料金'))
    // getByText normalizes an element's rendered text (collapsing the raw
    // \n\n buildStaticFaqAnswers joins multi-entry answers with) before
    // matching — normalize the captured text the same way so the later
    // getAllByText comparison isn't comparing raw vs. normalized whitespace.
    const buttonAnswer = screen.getByText(/施術内容/).textContent!.replace(/\s+/g, ' ').trim()

    fireEvent.click(screen.getByText('質問を入力する'))
    fireEvent.change(screen.getByPlaceholderText('ご質問を入力してください。お答えできる範囲でご案内します。'), {
      target: { value: '料金はいくらですか' },
    })
    fireEvent.click(screen.getByRole('button', { name: '送信' }))

    // The static matcher (faq-matcher.test.ts) resolves this free-text
    // question to the SAME node — no AI call, and the same answer text
    // buildStaticFaqAnswers already gave the button.
    expect(requestAiAnswer).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getAllByText(buttonAnswer).length).toBeGreaterThan(0)
    })
  })
})
