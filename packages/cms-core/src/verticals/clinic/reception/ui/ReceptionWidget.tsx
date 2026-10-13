'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CHAT_WIDGET_TITLE } from '../techmirai-chat-content'
import { ReceptionPanel } from './ReceptionPanel'
import type { HostLinks } from './useReceptionEngine'

export interface ReceptionWidgetProps {
  enabled: boolean
  greeting: Record<string, string>
  openDelayMs: number
  locales: string[]
  /** The current page's route locale — preferred over locales[0] when choosing the initial greeting. */
  locale: string
  clinicPhone: string
  clinicName: string
  /** Per-client URLs for the LINE, demo and brochure buttons — see useReceptionEngine. */
  hostLinks?: HostLinks
  accentColor?: string
}

/**
 * Floating launcher shell, adapted from sadiatec-assistant's ChatWidget.tsx
 * (bubble/teaser/open-delay animation is generic UI chrome, reused as-is;
 * the conversation logic underneath is entirely new — see ReceptionPanel).
 */
export function ReceptionWidget({
  enabled,
  greeting,
  openDelayMs,
  locales,
  locale,
  clinicPhone,
  clinicName,
  hostLinks,
  accentColor = '#0F6E56',
}: ReceptionWidgetProps) {
  const [open, setOpen] = useState(false)
  const [render, setRender] = useState(false)
  const [shown, setShown] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const everOpened = useRef(false)

  const initialLocale = locales.includes(locale) ? locale : locales[0] ?? 'ja'

  useEffect(() => {
    if (open) {
      setRender(true)
      const id = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(id)
    }
    setShown(false)
    const id = setTimeout(() => setRender(false), 200)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!enabled || !openDelayMs || everOpened.current) return
    const id = setTimeout(() => {
      if (!everOpened.current) setTeaser(true)
    }, openDelayMs)
    return () => clearTimeout(id)
  }, [enabled, openDelayMs])

  if (!enabled) return null

  function toggle() {
    setOpen((v) => {
      const next = !v
      if (next) {
        everOpened.current = true
        setTeaser(false)
      }
      return next
    })
  }

  const teaserText = greeting[initialLocale] ?? Object.values(greeting)[0] ?? ''

  return (
    <div
      // Pack-2/E2: shifted up at phone width so it doesn't sit on top of
      // the mobile sticky bottom bar HeaderClient.tsx added in E1.
      className="fixed bottom-[72px] right-5 z-[9999] flex flex-col items-end gap-3 lg:bottom-5"
      style={{ ['--reception-accent' as string]: accentColor } as CSSProperties}
    >
      {render && (
        <div
          className={[
            'origin-bottom-right transition-all duration-200 ease-out',
            shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0',
          ].join(' ')}
        >
          <ReceptionPanel
            initialLocale={initialLocale}
            availableLocales={locales}
            onClose={() => setOpen(false)}
            greeting={greeting}
            clinicPhone={clinicPhone}
            clinicName={clinicName}
            {...(hostLinks ? { hostLinks } : {})}
          />
        </div>
      )}

      {teaser && !open && teaserText && (
        <button
          type="button"
          onClick={toggle}
          className="max-w-[15rem] rounded-2xl rounded-br-sm border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 shadow-lg transition hover:shadow-xl"
        >
          {teaserText}
        </button>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={CHAT_WIDGET_TITLE}
        aria-expanded={open}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-[var(--reception-accent)] text-white shadow-lg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--reception-accent)] focus-visible:ring-offset-2"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.4a8.38 8.38 0 0 1-.9-3.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
