'use client'

import { useState, useId, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import type { ResolvedNavItem } from './Header'
import { Jp, Us } from 'react-flag-icons'          // ← Bd removed
import { SearchBox } from './SearchBox'
import siteConfig from '../../../../../site.config'
import type { LucideIcon } from 'lucide-react'
import { Bot, ClipboardList, Puzzle, Wallet, Building2, Cpu, Phone, Circle } from 'lucide-react'

// Pack-2/E1: keyed by href (guaranteed identical across locales, unlike
// `label`, which is localized) — same convention as hero/component.tsx.
const navIconMapByHref: Record<string, LucideIcon> = {
  '/ai-reception': Bot,
  '/how-it-works': ClipboardList,
  '/integrations': Puzzle,
  '/pricing': Wallet,
  '/about': Building2,
  '/technology': Cpu,
}

interface MobileMenuProps {
  navItems: ResolvedNavItem[]
  ctaLabel: string
  ctaHref: string
  locales: string[]
  localeLabels: Record<string, string>
  locale: string
  strippedPath: string
  scrolled: boolean
  onOpenChange?: (isOpen: boolean) => void
  phoneButton?: { phoneDisplay: string; phoneHref: string; badgeLabel: string; subLabel: string } | undefined
  lineButton?: { href: string; label: string; subLabel: string } | undefined
}

const leftDrawerNormal = {
  closed: { x: '-100%', transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] as const } },
  open: { x: '0%', transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] as const } },
}

const leftDrawerReduced = {
  closed: { x: '-100%', transition: { duration: 0.01 } },
  open: { x: '0%', transition: { duration: 0.01 } },
}

const backdropNormal = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.25 } },
}

const backdropReduced = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.01 } },
}

const accordionNormal = {
  open: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: 'easeInOut' as const } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeInOut' as const } },
}

const accordionReduced = {
  open: { height: 'auto', opacity: 1, transition: { duration: 0.01 } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.01 } },
}

export function MobileMenu({
  navItems,
  ctaLabel,
  ctaHref,
  locales,
  localeLabels,
  locale,
  strippedPath,
  scrolled,
  onOpenChange,
  phoneButton,
  lineButton,
}: MobileMenuProps) {
  const t = useTranslations('a11y')
  const [isOpen, setIsOpen] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const drawerId = useId()
  const reduced = useReducedMotion() ?? false

  const drawerVariants = reduced ? leftDrawerReduced : leftDrawerNormal
  const backdropVariants = reduced ? backdropReduced : backdropNormal
  const accordion = reduced ? accordionReduced : accordionNormal

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (onOpenChange) onOpenChange(isOpen)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, onOpenChange])

  const close = () => { setIsOpen(false); setOpenIndex(null) }
  const toggleIndex = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  const portalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-start pointer-events-none">
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={close}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          />

          <motion.aside
            id={drawerId}
            key="drawer"
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative h-full w-96 max-w-[90vw] bg-white shadow-2xl flex flex-col overflow-hidden text-left pointer-events-auto z-10"
          >
            {/* Top Header */}
            <div className="flex h-20 items-center justify-between px-5 border-b border-neutral-100 shrink-0 bg-white">
              <Link href="/" onClick={close} aria-label={`${siteConfig.site.name} Home`}>
                <span className="text-2xl tracking-wide select-none">
                  <span className="font-light text-brand-accent">{siteConfig.site.name}</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label={t('closeMenu')}
                onClick={close}
                className="flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent min-h-[44px] min-w-[44px]"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <SearchBox locale={locale} variant="mobile" onNavigate={close} />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={t('mobileNavigation')}>
              <ul role="list" className="space-y-1">
                {navItems.map((item, index) => {
                  const hasChildren = (item.children ?? []).length > 0 || (item.megaMenu && (item.megaColumns ?? []).length > 0)
                  const isExpanded = openIndex === index

                  return (
                    <li key={`${item.href}-${index}`}>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleIndex(index)}
                          aria-expanded={isExpanded}
                          className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-gray-900 hover:bg-neutral-100 hover:text-brand-primary transition-all duration-200 min-h-[48px]"
                        >
                          <span>{item.label}</span>
                          <svg className={`h-4 w-4 text-gray-400 group-hover:text-brand-primary transition-all duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={close}
                          className="group flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-900 hover:bg-neutral-100 hover:text-brand-primary transition-all duration-200 min-h-[48px]"
                        >
                          {(() => {
                            const Icon = navIconMapByHref[item.href] ?? Circle
                            return <Icon className="w-5 h-5 text-brand-primary shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
                          })()}
                          <span>{item.label}</span>
                        </Link>
                      )}

                      {hasChildren && (
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div variants={accordion} initial="closed" animate="open" exit="closed" className="overflow-hidden">
                              <div className="pl-4 pr-2 pb-2">
                                <div className="border-l-2 border-brand-primary-light pl-3 space-y-3">
                                  {item.megaMenu ? (
                                    (item.megaColumns ?? []).map((col, colIdx) => {
                                      const showHeading = col.heading && col.heading.toLowerCase() !== 'more services'
                                      return (
                                        <div key={colIdx} className="space-y-1">
                                          {showHeading && (
                                            <p className="px-3 pt-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                                              {col.heading}
                                            </p>
                                          )}
                                          {(col.items ?? []).map((child, childIdx) => (
                                            <Link
                                              key={`${child.href}-${colIdx}-${childIdx}`}
                                              href={child.href}
                                              onClick={close}
                                              className="group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:text-brand-primary hover:bg-neutral-100 hover:translate-x-1 transition-all duration-200 min-h-[40px]"
                                            >
                                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary transition-transform duration-200 group-hover:scale-125" />
                                              <span>{child.label}</span>
                                            </Link>
                                          ))}
                                        </div>
                                      )
                                    })
                                  ) : (
                                    (item.children ?? []).map((child, childIdx) => (
                                      <Link
                                        key={`${child.href}-${childIdx}`}
                                        href={child.href}
                                        onClick={close}
                                        className="group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:text-brand-primary hover:bg-neutral-100 hover:translate-x-1 transition-all duration-200 min-h-[40px]"
                                      >
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary transition-transform duration-200 group-hover:scale-125" />
                                        <span>{child.label}</span>
                                      </Link>
                                    ))
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* Call & LINE Buttons */}
              <div className="grid grid-cols-2 gap-3 px-4 py-3 border-t border-neutral-100 mt-2">
                <a
                  href={phoneButton?.phoneHref}
                  onClick={close}
                  className="group relative flex items-center justify-center gap-2 h-12 rounded-full border border-gray-200 hover:border-brand-primary bg-white text-gray-900 hover:text-brand-primary font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Phone className="w-4 h-4 fill-current text-gray-900 group-hover:text-brand-primary shrink-0 transition-colors duration-200" />
                  <span>{phoneButton?.phoneDisplay}</span>
                </a>

                <a
                  href={lineButton?.href}
                  onClick={close}
                  className="group flex items-center justify-center gap-2 h-12 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current shrink-0 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63h-1.625v1.25h1.625c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.256c-.348 0-.63-.285-.63-.629V8.108c0-.345.282-.63.63-.63h2.256c.349 0 .63.285.63.63 0 .349-.281.63-.63.63h-1.625v1.125h1.625zm-3.896 3.14c0 .248-.146.467-.37.561-.089.038-.184.057-.278.057-.152 0-.301-.052-.422-.152l-2.732-3.414v2.888c0 .344-.282.629-.63.629-.349 0-.63-.285-.63-.629V8.108c0-.247.146-.467.37-.561.225-.094.484-.04.65.129l2.731 3.414V8.108c0-.345.282-.63.63-.63.349 0 .63.285.63.63v4.895zm-6.173 0c0 .344-.282.629-.63.629-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.348 0 .63.285.63.63v4.895zm-2.487 0c0 .344-.282.629-.63.629H3.923c-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.348 0 .63.285.63.63v4.266h1.89c.348 0 .63.283.63.629zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314z" />
                  </svg>
                  <span>{lineButton?.label || 'LINE'}</span>
                </a>
              </div>
            </nav>



          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Mobile Header: Flags + Hamburger */}
      <div className="flex lg:hidden items-center gap-1">
        {/* Flags - only JA and EN */}
        <div className="flex items-center gap-1 bg-[var(--color-surface-alt)] px-2 py-1 rounded-2xl border border-gray-200">
          {['ja', 'en'].map((loc) => {
            const isCurrentLocale = locale === loc
            return (
              <Link
                key={loc}
                href={strippedPath}
                locale={loc}
                aria-label={loc === 'ja' ? '日本語に切り替え' : 'Switch to English'}
                className={[
                  "transition-all duration-200 p-0.5 rounded-lg",
                  isCurrentLocale ? "scale-110" : "hover:scale-105 opacity-75 hover:opacity-100"
                ].join(" ")}
              >
                {loc === 'ja' ? (
                  <Jp size={isCurrentLocale ? 20 : 18} className="block" />
                ) : (
                  <Us size={isCurrentLocale ? 20 : 18} className="block" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Hamburger Button */}
        <button
          type="button"
          aria-label={t('openMenu')}
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-neutral-100 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent min-h-[44px] min-w-[44px]"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {mounted && createPortal(portalContent, document.body)}
    </>
  )
}