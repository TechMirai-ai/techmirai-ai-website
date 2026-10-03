"use client"

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion'

interface LanguageSwitcherProps {
  locales: string[]
  currentLocale: string
  localeLabels: Record<string, string>
  onLocaleSwitch: (locale: string) => void
}

const dropdownVariantsNormal = {
  hidden: { opacity: 0, y: -4, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } },
}

const dropdownVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
}

export function LanguageSwitcher({
  locales,
  currentLocale,
  localeLabels,
  onLocaleSwitch,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion() ?? false
  const dropdownVariants = reduced ? dropdownVariantsReduced : dropdownVariantsNormal

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const otherLocales = locales.filter((l) => l !== currentLocale)

  return (
    <>
      {/* Desktop dropdown */}
      <div ref={containerRef} className="relative hidden md:block">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium
            text-[var(--color-text)] hover:bg-neutral-100 focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors min-h-[44px]"
        >
          <span>{localeLabels[currentLocale] ?? currentLocale.toUpperCase()}</span>
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.ul
              role="menu"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-full mt-1 min-w-[6rem] rounded-md border
                border-neutral-200 bg-[var(--color-background)] shadow-md py-1 z-50"
            >
              {otherLocales.map((locale) => (
                <li key={locale} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onLocaleSwitch(locale)
                      setIsOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)]
                      hover:bg-neutral-100 focus-visible:outline-none focus-visible:bg-neutral-100"
                  >
                    {localeLabels[locale] ?? locale.toUpperCase()}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile inline row */}
      <div className="flex md:hidden items-center gap-1">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => {
              if (locale !== currentLocale) onLocaleSwitch(locale)
            }}
            aria-current={locale === currentLocale ? 'true' : undefined}
            className={[
              'px-2.5 py-1.5 rounded-md text-sm font-medium min-h-[44px] min-w-[44px] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
              locale === currentLocale
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text)] hover:bg-neutral-100',
            ].join(' ')}
          >
            {localeLabels[locale] ?? locale.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  )
}
