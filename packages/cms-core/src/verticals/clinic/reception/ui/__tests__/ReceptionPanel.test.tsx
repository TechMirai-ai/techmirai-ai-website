import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
  clinicName: 'TechMirai',
}

/** A menu or next button by its label. The last match: "Talk to a person" is also the always-visible header link. */
function button(name: string) {
  return screen.getAllByRole('button', { name }).at(-1)!
}

function pressButton(name: string) {
  fireEvent.click(button(name))
}

// K1 rewrite of the clinic-era panel tests (docs/FINDINGS.md, K1). The intent of
// each test is kept — inline booking, links, greeting override, locale, the
// free-text path and its four outcomes — against the TechMirai flow.
describe('ReceptionPanel', () => {
  it('mounts BookingFlow inline when "Book a call" is chosen', () => {
    render(<ReceptionPanel {...defaultProps} />)

    pressButton('無料診断・相談')
    pressButton('面談を予約')

    expect(screen.getByTestId('booking-flow-mock')).toHaveTextContent('TechMirai')
  })

  it('renders an internal link button, locale-prefixed, that does not leave the conversation', () => {
    render(<ReceptionPanel {...defaultProps} />)

    pressButton('料金について')

    expect(screen.getByRole('link', { name: '料金ページ' })).toHaveAttribute('href', '/ja/pricing')
    // The same node is still showing its buttons.
    expect(screen.getByRole('link', { name: '無料診断' })).toHaveAttribute('href', '/ja/assessment')
    expect(button('メニュー')).toBeInTheDocument()
  })

  it('"Send my website" goes to /assessment', () => {
    render(<ReceptionPanel {...defaultProps} />)

    pressButton('無料診断・相談')

    expect(screen.getByRole('link', { name: 'ホームページを送る' })).toHaveAttribute('href', '/ja/assessment')
  })

  it('renders the config-supplied greeting override instead of the built-in default', () => {
    render(<ReceptionPanel {...defaultProps} greeting={{ ja: 'いらっしゃいませ！', en: 'Welcome!' }} />)
    expect(screen.getByText('いらっしゃいませ！')).toBeInTheDocument()
  })

  it('shows the widget title, the automated-assistant tag and the Talk to a person link on the first screen', () => {
    render(<ReceptionPanel {...defaultProps} />)

    expect(screen.getByText('TechMirai AI受付')).toBeInTheDocument()
    expect(screen.getByText('自動応答')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'スタッフと話す' }).length).toBeGreaterThan(0)
  })

  it('keeps "Talk to a person" visible after navigating, and it opens the hand-off answer from anywhere', () => {
    render(<ReceptionPanel {...defaultProps} />)

    pressButton('業種別の活用例')
    pressButton('クリニック・治療院')
    fireEvent.click(screen.getAllByRole('button', { name: 'スタッフと話す' })[0]!)

    expect(screen.getByText(/かしこまりました/)).toBeInTheDocument()
  })

  it('switches language and restarts the conversation', () => {
    render(<ReceptionPanel {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Automated assistant')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'What is AI受付?' })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Per-client links (LINE, call, demo) — resolved by the host, hidden when unset.
// ─────────────────────────────────────────────────────────────────────────────

describe('ReceptionPanel — host-resolved links', () => {
  const LINE_URL = 'https://line.me/R/ti/p/@techmirai-test'

  it('renders the LINE button as an external link in a new tab when configured', () => {
    render(<ReceptionPanel {...defaultProps} hostLinks={{ line: LINE_URL }} />)

    pressButton('スタッフと話す')

    const link = screen.getByRole('link', { name: 'LINE' })
    expect(link).toHaveAttribute('href', LINE_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('hides the LINE button entirely — never a dead button — when unset or blank', () => {
    const { unmount } = render(<ReceptionPanel {...defaultProps} />)
    pressButton('スタッフと話す')
    expect(screen.queryByRole('link', { name: 'LINE' })).not.toBeInTheDocument()
    unmount()

    render(<ReceptionPanel {...defaultProps} hostLinks={{ line: '   ' }} />)
    pressButton('スタッフと話す')
    expect(screen.queryByRole('link', { name: 'LINE' })).not.toBeInTheDocument()
  })

  it('offers Call as a tel: link when the phone number is dialable, and the email form always', () => {
    render(<ReceptionPanel {...defaultProps} />)

    pressButton('スタッフと話す')

    expect(screen.getByRole('link', { name: '電話' })).toHaveAttribute('href', 'tel:+81354321188')
    expect(screen.getByRole('link', { name: 'メールフォーム' })).toHaveAttribute('href', '/ja/contact')
  })

  it('hides Call when the configured phone is not dialable', () => {
    render(<ReceptionPanel {...defaultProps} clinicPhone="[TBD]" />)

    pressButton('スタッフと話す')

    expect(screen.queryByRole('link', { name: '電話' })).not.toBeInTheDocument()
  })

  it('opens the demo in a new tab only when the demo URL is a real http(s) URL', () => {
    const { unmount } = render(<ReceptionPanel {...defaultProps} hostLinks={{ demo: '[demo.techmirai-ai.com]' }} />)
    pressButton('デモを見る')
    expect(screen.queryByRole('link', { name: 'デモを開く' })).not.toBeInTheDocument()
    unmount()

    render(<ReceptionPanel {...defaultProps} hostLinks={{ demo: 'https://demo.example.test' }} />)
    pressButton('デモを見る')
    const link = screen.getByRole('link', { name: 'デモを開く' })
    expect(link).toHaveAttribute('href', 'https://demo.example.test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Free text — the always-visible question box, and the four things that can
// come back from it. The Groq call is never made here: `requestAiAnswer` is
// the injected seam standing in for POST /api/reception/ai, and the matched and
// screened paths are exercised by asserting it is NOT called.
// ─────────────────────────────────────────────────────────────────────────────

const HINT = 'ご質問は、下の欄に入力することもできます。'
const SEND = { name: '送信' }
const AI_UNKNOWN = /その内容はわかりかねます/
// Nothing in the 36 matched answers covers it and neither screen catches it.
const UNMATCHED_QUESTION = 'ペットを連れて行っても良いですか'

describe('ReceptionPanel — free-text question box', () => {
  function renderPanel(requestAiAnswer?: RequestReceptionAiAnswer) {
    return render(<ReceptionPanel {...defaultProps} {...(requestAiAnswer ? { requestAiAnswer } : {})} />)
  }

  function ask(text: string) {
    fireEvent.change(screen.getByPlaceholderText(HINT), { target: { value: text } })
    fireEvent.click(screen.getByRole('button', SEND))
  }

  it('is visible from the first screen, with the Spec hint as its placeholder — never a raw key', () => {
    renderPanel()

    const input = screen.getByPlaceholderText(HINT)
    expect(input).toBeInTheDocument()
    expect(input).not.toBeDisabled()
  })

  it('disables the submit button while the draft is empty and enables it once the user types', () => {
    renderPanel()

    expect(screen.getByRole('button', SEND)).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText(HINT), { target: { value: UNMATCHED_QUESTION } })
    expect(screen.getByRole('button', SEND)).not.toBeDisabled()
  })

  it('disables the submit button while the answer is in flight', async () => {
    let release: (value: ReceptionAiResponse) => void = () => {}
    const pending = new Promise<ReceptionAiResponse>((resolve) => {
      release = resolve
    })
    renderPanel(() => pending)

    ask(UNMATCHED_QUESTION)

    expect(screen.getByRole('button', SEND)).toBeDisabled()

    release({ status: 'answered', answer: 'ペットのお連れについては、スタッフにご確認ください。' })
    await waitFor(() => {
      expect(screen.getByText('ペットのお連れについては、スタッフにご確認ください。')).toBeInTheDocument()
    })
  })

  it('shows the grounded answer, then the hand-off buttons — one answer, not a chat', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: 'スタッフがご案内します。' }))
    renderPanel(requestAiAnswer)

    ask(UNMATCHED_QUESTION)

    await waitFor(() => {
      expect(screen.getByText('スタッフがご案内します。')).toBeInTheDocument()
    })
    expect(requestAiAnswer).toHaveBeenCalledWith({ question: UNMATCHED_QUESTION, locale: 'ja' })
    // The question renders as its own bubble, and the flow ends at a person.
    expect(screen.getByText(UNMATCHED_QUESTION)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'メールフォーム' })).toBeInTheDocument()
  })

  it('degrades to the Spec "AI does not know" copy when the answer is unavailable — never an error, never an empty bubble', async () => {
    renderPanel(async () => ({ status: 'unavailable' }))

    ask(UNMATCHED_QUESTION)

    await waitFor(() => {
      expect(screen.getByText(AI_UNKNOWN)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'メールフォーム' })).toBeInTheDocument()
  })

  it('answers an off-topic question with the rule-13 redirect and the menu, without ever calling the server', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: '晴れです' }))
    renderPanel(requestAiAnswer)

    ask('今日の天気はどうですか')

    // Spec rule 13 gives no wording, so the reply is the labelled placeholder
    // (register K2-02) — and the six menu buttons follow it.
    await waitFor(() => {
      expect(screen.getByText('[JA TODO]')).toBeInTheDocument()
    })
    expect(button('AI受付とは？')).toBeInTheDocument()
    expect(requestAiAnswer).not.toHaveBeenCalled()
    expect(screen.queryByText('晴れです')).not.toBeInTheDocument()
  })

  it('routes a medical free-text question to the F09 "no advice" answer without ever calling the server', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: '3回で治ります' }))
    renderPanel(requestAiAnswer)

    ask('腰が痛い')

    await waitFor(() => {
      expect(screen.getByText(/AI受付は医療や法律の助言を行わず/)).toBeInTheDocument()
    })
    expect(requestAiAnswer).not.toHaveBeenCalled()
    expect(screen.queryByText('3回で治ります')).not.toBeInTheDocument()
  })

  it('does not route anything on an empty submission', () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'unavailable' as const }))
    const { container } = renderPanel(requestAiAnswer)
    const messageCountBefore = container.querySelectorAll('[class*="rounded-2xl"][class*="px-3.5"]').length

    // Bypass the disabled submit button to exercise submitFreeText's own guard.
    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(container.querySelectorAll('[class*="rounded-2xl"][class*="px-3.5"]').length).toBe(messageCountBefore)
    expect(requestAiAnswer).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The six menu buttons — Spec §16.2 answers, in both languages, plus the
// sub-buttons and the way back. A button and a typed question give one answer.
// ─────────────────────────────────────────────────────────────────────────────

describe('ReceptionPanel — the six menu buttons show the Spec answer', () => {
  it.each([
    ['AI受付とは？', /ホームページ・チャット・LINEで働く受付の仕組みです/],
    ['デモを見る', /実際に動くクリニックのホームページです/],
    ['料金について', /初期費用\[30万円\]〜、月額\[3万円\]〜/],
    ['業種別の活用例', /どちらの業種でしょうか/],
    ['無料診断・相談', /30分のオンライン面談/],
    ['スタッフと話す', /平日 9:00〜18:00/],
  ])('ja: tapping "%s" shows its answer', (label, expected) => {
    render(<ReceptionPanel {...defaultProps} />)
    pressButton(label)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it.each([
    ['What is AI受付?', /AI受付 is a front desk for your website, chat and LINE/],
    ['See the live demo', /Our live demo is a working clinic website/],
    ['Pricing', /Starter Package starts from \[¥300,000\] for setup and \[¥30,000\] per month/],
    ['Examples by industry', /Which business are you in\?/],
    ['Free assessment or consultation', /book a 30-minute online call/],
    ['Talk to a person', /Of course\. Our team replies/],
  ])('en: tapping "%s" shows its answer', (label, expected) => {
    render(<ReceptionPanel {...defaultProps} initialLocale="en" />)
    pressButton(label)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('B1 offers B1a, B1b and Menu; B1a answers and Menu returns to the main menu', () => {
    render(<ReceptionPanel {...defaultProps} initialLocale="en" />)

    pressButton('What is AI受付?')
    expect(button('How accurate is it?')).toBeInTheDocument()
    expect(button('Web and Voice')).toBeInTheDocument()

    pressButton('How accurate is it?')
    expect(screen.getByText(/Prices and availability always come from booking data, never AI/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/en/how-it-works')

    pressButton('Menu')
    expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument()
    expect(button('Pricing')).toBeInTheDocument()
  })

  it('B4 offers the five industries, each with its answer', () => {
    render(<ReceptionPanel {...defaultProps} initialLocale="en" />)

    pressButton('Examples by industry')
    for (const label of ['Clinic', 'Beauty', 'Auto', 'Hotel', 'Other']) {
      expect(button(label)).toBeInTheDocument()
    }

    pressButton('Hotel')
    expect(screen.getByText(/Room bookings stay with your current booking system/)).toBeInTheDocument()
  })

  it('tapping "Pricing" and typing "how much does it cost?" give the same answer — one source', async () => {
    const requestAiAnswer = vi.fn(async () => ({ status: 'answered' as const, answer: 'AI FALLBACK — SHOULD NOT BE USED' }))
    render(<ReceptionPanel {...defaultProps} initialLocale="en" requestAiAnswer={requestAiAnswer} />)

    pressButton('Pricing')
    fireEvent.change(screen.getByPlaceholderText('Or type your question below.'), { target: { value: 'How much does it cost?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(screen.getAllByText(/Starter Package starts from \[¥300,000\]/)).toHaveLength(2)
    })
    expect(requestAiAnswer).not.toHaveBeenCalled()
  })
})
