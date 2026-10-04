'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Fuse from 'fuse.js'

interface SearchIndexEntry {
  id: string
  title: string
  href: string
  excerpt?: string
  locale: string
  source: string
}

interface SearchBoxProps {
  locale: string
  variant: 'desktop' | 'mobile'
  onNavigate?: () => void
}

const DEBOUNCE_MS = 200
const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 8

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function SearchBox({ locale, variant, onNavigate }: SearchBoxProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [expanded, setExpanded] = useState(variant === 'mobile')
  const [entries, setEntries] = useState<SearchIndexEntry[] | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [rawQuery, setRawQuery] = useState('')
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(rawQuery), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [rawQuery])

  // The index is locale-specific, but this component's state persists across
  // a client-side language switch (the [locale] route segment re-renders
  // rather than remounting) — drop the stale index so the next open refetches.
  useEffect(() => {
    setEntries(null)
    setLoadState('idle')
  }, [locale])

  useEffect(() => {
    if (!expanded) return

    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (variant === 'desktop') setExpanded(false)
        setRawQuery('')
        setQuery('')
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [expanded, variant])

  async function ensureIndexLoaded() {
    if (entries !== null || loadState === 'loading') return
    setLoadState('loading')
    try {
      const res = await fetch(`/api/search-index?locale=${locale}`)
      const json = await res.json()
      if (json.success) {
        setEntries(json.data as SearchIndexEntry[])
        setLoadState('ready')
      } else {
        setLoadState('error')
      }
    } catch {
      setLoadState('error')
    }
  }

  const fuse = useMemo(() => {
    if (!entries) return null
    return new Fuse(entries, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'excerpt', weight: 0.3 },
      ],
      threshold: 0.38,
      ignoreLocation: true,
      minMatchCharLength: MIN_QUERY_LENGTH,
    })
  }, [entries])

  const results = useMemo(() => {
    if (!fuse || query.trim().length < MIN_QUERY_LENGTH) return []
    return fuse.search(query).slice(0, MAX_RESULTS).map((r) => r.item)
  }, [fuse, query])

  useEffect(() => {
    setActiveIndex(results.length > 0 ? 0 : -1)
  }, [results])

  function reset() {
    setRawQuery('')
    setQuery('')
    setActiveIndex(-1)
  }

  function navigateTo(entry: SearchIndexEntry) {
    router.push(entry.href)
    reset()
    if (variant === 'desktop') setExpanded(false)
    onNavigate?.()
  }

  function openDesktop() {
    setExpanded(true)
    void ensureIndexLoaded()
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function closeDesktop() {
    setExpanded(false)
    reset()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = results[activeIndex]
      if (entry) navigateTo(entry)
    } else if (e.key === 'Escape') {
      if (variant === 'desktop') closeDesktop()
      else {
        reset()
        inputRef.current?.blur()
      }
    }
  }

  const showPanel = query.trim().length >= MIN_QUERY_LENGTH && (variant === 'mobile' ? true : expanded)

  const listboxId = 'search-results-listbox'

  return (
    <div ref={containerRef} className={variant === 'desktop' ? 'flex items-center' : 'relative px-4 py-3 border-b border-neutral-100'}>
      {variant === 'desktop' && !expanded && (
        <button
          type="button"
          aria-label="Open search"
          onClick={openDesktop}
          className="inline-flex items-center justify-center rounded-full p-2 text-text-primary hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent min-h-[40px] min-w-[40px]"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      )}

      {(variant === 'mobile' || expanded) && (
        <div
  className={
    variant === 'desktop'
      ? 'absolute right-4 sm:right-6 lg:right-6 xl:right-12 2xl:right-20 top-full mt-2 w-[90vw] max-w-md'
      : 'relative w-full'
  }
>
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showPanel}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
              value={rawQuery}
              onFocus={() => void ensureIndexLoaded()}
              onChange={(e) => setRawQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search..."
              className="w-full rounded-full border border-gray-200 bg-[var(--color-surface-alt)] py-2 pl-9 pr-9 text-sm text-text-primary placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            />
            {variant === 'desktop' && (
              <button
                type="button"
                aria-label="Close search"
                onClick={closeDesktop}
                className="absolute right-2 flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-600"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {showPanel && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl bg-white shadow-xl border border-neutral-100 py-2 z-50"
            >
              {loadState === 'loading' && (
                <li className="px-4 py-3 text-sm text-gray-400">Loading…</li>
              )}
              {loadState === 'error' && (
                <li className="px-4 py-3 text-sm text-[var(--color-error)]">Search is unavailable right now.</li>
              )}
              {loadState === 'ready' && results.length === 0 && (
                <li className="px-4 py-3 text-sm text-gray-400">No results found.</li>
              )}
              {loadState === 'ready' &&
                results.map((entry, index) => (
                  <li key={entry.id} id={`${listboxId}-option-${index}`} role="option" aria-selected={index === activeIndex}>
                    <Link
                      href={entry.href}
                      onClick={() => {
                        reset()
                        if (variant === 'desktop') setExpanded(false)
                        onNavigate?.()
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={[
                        'block px-4 py-2.5 transition-colors',
                        index === activeIndex ? 'bg-brand-accent/5' : '',
                      ].join(' ')}
                    >
                      <span className="block text-sm font-semibold text-gray-900 leading-snug">{entry.title}</span>
                      {entry.excerpt && (
                        <span className="mt-0.5 block text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {entry.excerpt}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
