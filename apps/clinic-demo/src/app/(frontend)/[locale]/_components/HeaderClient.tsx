'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { MobileMenu } from './MobileMenu'
import { SearchBox } from './SearchBox'
import type { ResolvedNavItem, ResolvedMegaColumn } from './Header'
import { Jp, Us } from 'react-flag-icons'
import siteConfig from '../../../../../site.config'

interface HeaderClientProps {
  navItems: ResolvedNavItem[]
  ctaLabel: string
  ctaHref: string
  locales: string[]
  localeLabels: Record<string, string>
  locale: string
  cmsLogoUrl?: string | null
  phoneButton?: { phoneDisplay: string; phoneHref: string; badgeLabel: string; subLabel: string } | undefined
  lineButton?: { href: string; label: string; subLabel: string } | undefined
}

function MegaMenuPanel({ item }: { item: ResolvedNavItem }) {
  const columns = item.megaColumns ?? []

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[1400px] max-w-[95vw] z-50
        opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible
        transition-all duration-200 origin-top pointer-events-none group-hover/item:pointer-events-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-100 p-12 grid grid-cols-12 gap-12 text-left">
        <div className="col-span-3 relative rounded-2xl overflow-hidden min-h-[450px] bg-neutral-50">
          {item.featuredImageUrl ? (
            <img
              src={item.featuredImageUrl}
              alt={item.featuredImageAlt || 'Featured Service'}
              className="object-cover w-full h-full absolute inset-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 italic bg-neutral-50/50">
              No Image Selected
            </div>
          )}
        </div>

        <div
          className="col-span-9 gap-12 text-left"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns.length}, 1fr)`
          }}
        >
          {columns.map((col, ci) => {
            const showHeading = col.heading && col.heading.toLowerCase() !== 'more services'
            return (
              <div key={ci} className="flex flex-col space-y-8">
                {showHeading && (
                  <p
                    className={[
                      "text-[11px] font-bold uppercase tracking-widest",
                      ci === 3
                        ? "text-brand-primary"
                        : "text-neutral-400"
                    ].join(" ")}
                  >
                    {col.heading}
                  </p>
                )}
                <ul className="space-y-8">
                  {(col.items ?? []).map((subItem, subIdx) => (
                    <li key={`${subItem.href}-${subIdx}`}>
                      <Link
                        href={subItem.href}
                        className="group block text-left navigation-item-wrapper focus:outline-none"
                      >
                        <span className="block text-[15px] font-bold text-gray-900 group-hover:text-brand-accent transition-colors leading-snug">
                          {subItem.label}
                        </span>
                        {subItem.description && (
                          <p className="mt-1.5 text-[12px] text-gray-500 font-normal leading-relaxed group-hover:text-gray-600 transition-colors">
                            {subItem.description}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DropdownPanel({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div
      className="absolute top-full left-0 pt-2 min-w-[220px] z-50
        opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible
        transition-all duration-200 origin-top-left pointer-events-none group-hover/item:pointer-events-auto"
    >
      <ul className="rounded-xl bg-white shadow-xl border border-neutral-100 py-2.5 overflow-hidden">
        {items.map((child, idx) => (
          <li key={`${child.href}-${idx}`}>
            <Link
              href={child.href}
              className="block px-5 py-2.5 text-sm text-text-secondary hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HeaderClient({
  navItems,
  ctaLabel,
  ctaHref,
  locales,
  localeLabels,
  locale,
  cmsLogoUrl,
  phoneButton,
  lineButton,
}: HeaderClientProps) {
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const prioritizedLocales = ['ja', ...locales.filter((l) => l !== 'ja')]

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 650)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const strippedPath = pathname.replace(/^\/(en|ja)(?=\/|$)/, '') || '/'
  const isHomepage = strippedPath === '/'
  const headerScrolled = isHomepage ? scrolled : true

  function isActive(item: ResolvedNavItem): boolean {
    const hasChildren = (item.children?.length ?? 0) > 0 || (item.megaMenu && (item.megaColumns?.length ?? 0) > 0)
    return hasChildren ? strippedPath.startsWith(item.href) : strippedPath === item.href
  }

  function Logo({ dark, imageUrl }: { dark: boolean; imageUrl?: string | null | undefined }) {
    const logoSrc = imageUrl || '/brand/Sakura-clinic-logo.png'

    return (
      <div className="relative flex items-center h-16 w-40 sm:h-20 sm:w-44 lg:h-20 lg:w-44 xl:h-20 xl:w-52 2xl:h-25 2xl:w-70 shrink-0 transition-all duration-300">
        <Image
          src={logoSrc}
          alt={`${siteConfig.site.name} Logo`}
          fill
          priority
          className="object-contain object-left"
          sizes="400px"
        />
      </div>
    )
  }

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ease-out',
        headerScrolled
          ? 'translate-y-0 opacity-100 border-b border-border-default shadow-sm'
          : 'translate-y-0 opacity-100 lg:-translate-y-full lg:opacity-0 lg:pointer-events-none',
      ].join(' ')}
    >
      <div className="relative flex items-center justify-between w-full px-2 sm:px-4 lg:px-3 xl:px-6 2xl:px-10 h-18 md:h-20 lg:h-22 gap-1.5 xl:gap-3 2xl:gap-6">
        <Link href="/" className="shrink-0">
          <Logo dark={true} imageUrl={cmsLogoUrl} />
        </Link>

        {/* Main Navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-1 xl:mx-2 h-full">
          <ul className="flex items-center justify-center gap-1 xl:gap-2 2xl:gap-4 h-full">
            {navItems.map((item, itemIdx) => {
              const hasMega = item.megaMenu && (item.megaColumns ?? []).length > 0
              const hasDropdown = !hasMega && (item.children ?? []).length > 0
              const active = isActive(item)
              const isLeaf = !hasMega && !hasDropdown

              return (
                <li key={`${item.href}-${itemIdx}`} className="relative group/item h-full flex items-center shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active && isLeaf ? 'page' : undefined}
                    className={[
                      'inline-flex items-center justify-center gap-0.5 px-1 xl:px-2 text-[11px] xl:text-xs 2xl:text-sm font-semibold tracking-tight text-center leading-tight whitespace-normal max-w-[85px] xl:max-w-[105px] 2xl:max-w-none',
                      'h-[48px] border-b-2 transition-colors duration-200',
                      active
                        ? 'text-brand-primary border-brand-primary'
                        : 'text-text-primary border-transparent hover:text-brand-primary hover:border-brand-primary',
                    ].join(' ')}
                  >
                    <span className="text-center leading-tight">
                      {item.label}
                    </span>
                    {(hasMega || hasDropdown) && (
                      <svg
                        className="h-3 w-3 text-text-muted transition-transform duration-200 group-hover/item:rotate-180 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>

                  {hasMega && <MegaMenuPanel item={item} />}
                  {hasDropdown && <DropdownPanel items={item.children!} />}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 2xl:gap-3 shrink-0">
          <SearchBox locale={locale} variant="desktop" />

          {/* Language Dropdown */}
          <div className="relative group/lang">
            <button
              type="button"
              className="flex items-center gap-1 px-1.5 xl:px-2.5 py-1.5 rounded-xl border border-gray-200 bg-[var(--color-surface-alt)] hover:bg-gray-50 transition-colors"
            >
              {locale === 'ja' ? (
                <Jp size={18} className="shrink-0" />
              ) : (
                <Us size={18} className="shrink-0" />
              )}
              <span className="text-[11px] xl:text-xs font-semibold uppercase tracking-wide text-text-primary">
                {locale === 'ja' ? 'JA' : 'EN'}
              </span>
              <svg
                className="w-3 h-3 text-text-muted transition-transform duration-200 group-hover/lang:rotate-180 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            <div
              className="absolute top-full right-0 pt-2 z-50
                opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible
                transition-all duration-200 origin-top-right pointer-events-none group-hover/lang:pointer-events-auto"
            >
              <div className="bg-white rounded-xl shadow-xl border border-neutral-100 py-1.5 min-w-[120px] overflow-hidden">
                {prioritizedLocales.map((loc) => {
                  const isCurrentLocale = locale === loc

                  return (
                    <Link
                      key={loc}
                      href={strippedPath}
                      locale={loc}
                      className={[
                        'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
                        isCurrentLocale
                          ? 'bg-brand-primary/5 text-brand-primary font-semibold'
                          : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary',
                      ].join(' ')}
                    >
                      {loc === 'ja' ? <Jp size={18} /> : <Us size={18} />}
                      <span>{loc === 'ja' ? '日本語' : 'English'}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {ctaLabel && (
            <Link href={ctaHref}>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#06C755] px-3 xl:px-4 2xl:px-5 py-2 text-xs xl:text-sm font-semibold tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-[#05b34c] hover:shadow-md whitespace-nowrap">
                <svg className="w-4 h-4 xl:w-5 xl:h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63h-1.625v1.25h1.625c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.256c-.348 0-.63-.285-.63-.629V8.108c0-.345.282-.63.63-.63h2.256c.349 0 .63.285.63.63 0 .349-.281.63-.63.63h-1.625v1.125h1.625zm-3.896 3.14c0 .248-.146.467-.37.561-.089.038-.184.057-.278.057-.152 0-.301-.052-.422-.152l-2.732-3.414v2.888c0 .344-.282.629-.63.629-.349 0-.63-.285-.63-.629V8.108c0-.247.146-.467.37-.561.225-.094.484-.04.65.129l2.731 3.414V8.108c0-.345.282-.63.63-.63.349 0 .63.285.63.63v4.895zm-6.173 0c0 .344-.282.629-.63.629-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.348 0 .63.285.63.63v4.895zm-2.487 0c0 .344-.282.629-.63.629H3.923c-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.348 0 .63.285.63.63v4.266h1.89c.348 0 .63.283.63.629zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314z" />
                </svg>
                <span>{ctaLabel}</span>
              </button>
            </Link>
          )}
        </div>

        <div className="flex lg:hidden ml-auto">
          <MobileMenu
            navItems={navItems}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            locales={locales}
            localeLabels={localeLabels}
            locale={locale}
            strippedPath={strippedPath}
            scrolled={headerScrolled}
            onOpenChange={setIsMobileMenuOpen}
            phoneButton={phoneButton}
            lineButton={lineButton}
          />
        </div>
      </div>
    </header>
  )
}