'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BookingFlow } from '../../../../booking/ui'
import { CHAT_INPUT_HINT, CHAT_TALK_TO_PERSON, CHAT_WIDGET_TITLE } from '../techmirai-chat-content'
import type { RequestReceptionAiAnswer } from './ai-client'
import type { HandoffHours } from '../handoff-hours'
import { useReceptionEngine, type HostLinks } from './useReceptionEngine'

const CHOICE_BUTTON_CLASS =
  'rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-primary-dark transition hover:border-[var(--reception-accent,#47A35A)] hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reception-accent,#47A35A)]'

const EXTERNAL_URL = /^(https?:|tel:|mailto:)/

const RECEPTION_LOCALES: Array<{ code: 'ja' | 'en'; label: string }> = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'EN' },
]

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export interface ReceptionPanelProps {
  initialLocale: string
  availableLocales: string[]
  onClose: () => void
  greeting: Record<string, string>
  clinicPhone: string
  /** The site name — the booking flow's success screen needs it. */
  clinicName: string
  /** Per-client URLs for the LINE, demo and brochure buttons — see useReceptionEngine. */
  hostLinks?: HostLinks
  /** When the team replies — see useReceptionEngine. */
  handoffHours?: HandoffHours
  /** Injectable clock for tests. */
  now?: () => Date
  /** Injectable for tests; defaults to the real POST /api/reception/ai client. */
  requestAiAnswer?: RequestReceptionAiAnswer
}

export function ReceptionPanel({
  initialLocale,
  availableLocales,
  onClose,
  greeting,
  clinicPhone,
  clinicName,
  hostLinks,
  handoffHours,
  now,
  requestAiAnswer,
}: ReceptionPanelProps) {
  const [locale, setLocale] = useState(initialLocale)
  const { messages, interaction, done, error, send, submitQuestion, talkToPerson, restart } = useReceptionEngine({
    locale,
    greeting,
    clinicPhone,
    ...(hostLinks ? { hostLinks } : {}),
    ...(handoffHours ? { handoffHours } : {}),
    ...(now ? { now } : {}),
    ...(requestAiAnswer ? { requestAiAnswer } : {}),
  })
  const textLocale = locale === 'ja' ? 'ja' : 'en'

  // Draft text for the always-visible question box. `pending` covers the
  // window between submit and the flow advancing: submitQuestion fetches a
  // grounded answer when the flow is about to need one, and only then routes
  // the question through the triage node.
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)

  async function submitFreeText() {
    const value = draft.trim()
    if (!value || pending) return
    setPending(true)
    setDraft('')
    try {
      // submitQuestion never rejects — every failure inside it is already
      // mapped to fixed copy — so there is no error branch to add here.
      await submitQuestion(value)
    } finally {
      setPending(false)
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, interaction])

  const localeOptions = RECEPTION_LOCALES.filter((l) => availableLocales.includes(l.code))

  return (
    <div className="flex h-[min(80vh,600px)] w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl shadow-2xl sm:w-[400px]">
      <header className="flex items-center gap-2 bg-[var(--reception-accent,#47A35A)] px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-on-primary">{CHAT_WIDGET_TITLE}</p>

        {localeOptions.length > 1 && (
          <div className="flex overflow-hidden rounded-full border border-on-primary/30 text-[11px]">
            {localeOptions.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code)}
                className={[
                  'px-2 py-1 transition',
                  l.code === locale ? 'bg-white font-semibold text-on-primary' : 'text-on-primary/80 hover:bg-black/10',
                ].join(' ')}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={restart}
          aria-label={locale === 'ja' ? 'やり直す' : 'Restart'}
          className="rounded-full p-1.5 text-on-primary/70 transition hover:bg-black/10 hover:text-on-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label={locale === 'ja' ? '閉じる' : 'Close'}
          className="rounded-full p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      {/* Pack-2/E2: AI disclosure tag, required on every page (Content Spec
          §16.1, mandated site-wide by §18 item 8) — "Automated assistant"/自動応答. */}
      <div className="flex items-center justify-between gap-2 bg-zinc-100 px-4 py-1.5 text-[11px] font-medium tracking-wide text-zinc-500">
        <span>{locale === 'ja' ? '自動応答' : 'Automated assistant'}</span>
        {/* Spec 16.1: always visible, whatever the conversation is doing. */}
        <button
          type="button"
          onClick={talkToPerson}
          className="rounded px-1 font-semibold text-brand-primary-dark underline underline-offset-2 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--reception-accent,#47A35A)]"
        >
          {CHAT_TALK_TO_PERSON[textLocale]}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={['flex', m.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
            <div className="flex max-w-[85%] flex-col gap-1">
              <div
                className={[
                  'whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'rounded-br-sm bg-[var(--reception-accent,#47A35A)] text-on-primary'
                    : 'rounded-bl-sm border border-zinc-100 bg-white text-zinc-800 shadow-sm',
                ].join(' ')}
              >
                {m.text}
              </div>
              <span className={['text-[10px] text-zinc-400', m.role === 'user' ? 'text-right' : 'text-left'].join(' ')}>
                {formatTime(m.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {interaction.kind === 'component' && interaction.componentId === 'booking' && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
            <BookingFlow locale={locale} clinicName={clinicName} />
          </div>
        )}

        {interaction.kind === 'link' &&
          (/^https?:\/\//.test(interaction.href) ? (
            // Outbound link (e.g. the "Talk to staff" LINE URL) — a raw
            // external URL, never locale-prefixed like the internal case
            // below, and opened in a new tab so the widget stays behind it.
            <a
              href={interaction.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-[var(--reception-accent,#47A35A)] px-4 py-2.5 text-sm font-medium text-on-primary transition hover:brightness-110"
            >
              {interaction.label}
            </a>
          ) : (
            <Link
              href={`/${locale}${interaction.href}`}
              className="inline-block rounded-xl bg-[var(--reception-accent,#47A35A)] px-4 py-2.5 text-sm font-medium text-on-primary transition hover:brightness-110"
            >
              {interaction.label}
            </Link>
          ))}
      </div>

      <div className="border-t border-zinc-100 bg-white px-3 py-3">
        {error && <p className="mb-2 px-1 text-xs text-rose-500">{error}</p>}

        {interaction.kind === 'choice' && (
          <div className="flex flex-wrap gap-2">
            {interaction.options.map((o) => {
              if (!o.href) {
                return (
                  <button key={o.value} type="button" onClick={() => send(o.value)} className={CHOICE_BUTTON_CLASS}>
                    {o.label}
                  </button>
                )
              }
              // A link option never advances the flow. External URLs (LINE, tel, the demo
              // site) are raw; internal paths get the locale prefix. `newTab` is the Spec's
              // "(new tab)" and always carries rel=noopener.
              const external = EXTERNAL_URL.test(o.href)
              const newTabProps = o.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}
              return external ? (
                <a key={o.value} href={o.href} {...newTabProps} className={CHOICE_BUTTON_CLASS}>
                  {o.label}
                </a>
              ) : (
                <Link key={o.value} href={`/${locale}${o.href}`} {...newTabProps} className={CHOICE_BUTTON_CLASS}>
                  {o.label}
                </Link>
              )
            })}
          </div>
        )}

        {interaction.kind !== 'component' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submitFreeText()
            }}
            className="mt-2 flex items-center gap-2 first:mt-0"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={CHAT_INPUT_HINT[textLocale]}
              aria-label={CHAT_INPUT_HINT[textLocale]}
              disabled={pending}
              className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[var(--reception-accent,#47A35A)] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || draft.trim() === ''}
              aria-label={locale === 'ja' ? '送信' : 'Send'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--reception-accent,#47A35A)] text-on-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-spin"
                  role="status"
                  aria-label={locale === 'ja' ? '送信中' : 'Sending'}
                >
                  <path d="M12 3a9 9 0 1 0 9 9" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22 11 13 2 9 22 2Z" />
                </svg>
              )}
            </button>
          </form>
        )}

        {done && (
          <button
            type="button"
            onClick={restart}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
          >
            {locale === 'ja' ? 'はじめに戻る' : 'Start over'}
          </button>
        )}
      </div>
    </div>
  )
}
