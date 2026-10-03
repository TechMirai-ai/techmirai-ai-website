'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import type { PageHeroBlockProps, PageHeroBreadcrumbItem } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

function PageTitleVariant({
  pageTitle,
  showBreadcrumb = false,
  breadcrumbItems = [],
}: {
  pageTitle: string
  showBreadcrumb?: boolean
  breadcrumbItems?: PageHeroBreadcrumbItem[]
}) {
  const locale = useLocale()
  return (
    <section aria-label={pageTitle} className="bg-white pt-8 pb-3 md:pt-16 md:pb-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {pageTitle}
        </h1>
        {showBreadcrumb && breadcrumbItems.length > 0 && (
          <nav aria-label="Breadcrumb" className="mt-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {breadcrumbItems.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-400">—</span>}
                  {item.href ? (
                    <Link href={withLocale(locale, item.href)} className="hover:text-slate-800">
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </section>
  )
}

export function PageHeroBlock({
  variant = 'hero',
  heading,
  coloredSubtitle,
  pageTitle,
  showBreadcrumb = false,
  breadcrumbItems = [],
  backgroundImageUrl,
}: PageHeroBlockProps) {
  const locale = useLocale()

  if (variant === 'page-title') {
    return (
      <PageTitleVariant
        pageTitle={pageTitle ?? ''}
        showBreadcrumb={showBreadcrumb}
        breadcrumbItems={breadcrumbItems}
      />
    )
  }

  return (
    <section className="relative w-full overflow-hidden bg-brand-surface pt-25 md:pt-30 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-4 lg:px-6">

        {/* ===== HERO IMAGE CONTAINER ===== */}
        <div className="relative w-full overflow-hidden rounded-3xl min-h-[360px] sm:min-h-[440px] md:min-h-[520px]">

          {/* Clipped Image (Cut deeper on the left side) */}
          {backgroundImageUrl ? (
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                clipPath: 'polygon(0% 48%, 55% 0%, 100% 0%, 100% 100%, 0% 100%)',
              }}
            >
              <Image
                src={backgroundImageUrl}
                alt={heading || 'Hero image'}
                fill
                className="object-cover rounded-3xl"
                sizes="100vw"
                priority
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 rounded-3xl"
              style={{
                clipPath: 'polygon(0% 48%, 55% 0%, 100% 0%, 100% 100%, 0% 100%)',
              }}
            >
              No image
            </div>
          )}

          {/* Heading & Subtitle Placed Outside Image (Over Cutout Area) */}
          <div className="relative z-10 pl-4 sm:pl-8 max-w-lg">
            {heading && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2A9D8F] leading-tight">
                {heading}
              </h1>
            )}

            {coloredSubtitle && (
              <p className="-mt-3 text-xs sm:text-sm tracking-wider text-slate-700 uppercase">
                {coloredSubtitle}
              </p>
            )}
          </div>
        </div>

       {/* ===== BOTTOM BREADCRUMB BUTTONS ===== */}
{showBreadcrumb && breadcrumbItems.length > 0 && (
  <nav aria-label="Breadcrumb" className="mt-8 md:mt-15">
    <ol className="flex flex-wrap items-center gap-3">
      {breadcrumbItems.map((item, i) => {
        const buttonClasses =
          "group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-[#2A9D8F] shadow-sm hover:border-[#2A9D8F]/40 hover:bg-slate-50/80 hover:text-[#1F7A6F] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"

        return (
          <li key={i}>
            {item.href ? (
              <Link
                href={withLocale(locale, item.href)}
                className={buttonClasses}
              >
                {item.label}
                <span className="text-xs transition-transform duration-200 group-hover:translate-y-0.5">
                  ↓
                </span>
              </Link>
            ) : (
              <span className={buttonClasses}>
                {item.label}
                <span className="text-xs transition-transform duration-200 group-hover:translate-y-0.5">
                  ↓
                </span>
              </span>
            )}
          </li>
        )
      })}
    </ol>
  </nav>
)}

      </div>
    </section>
  )
}