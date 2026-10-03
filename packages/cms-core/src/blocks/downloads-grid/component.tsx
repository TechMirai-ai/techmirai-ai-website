'use client'
// Client boundary: scroll-triggered stagger animation via Framer Motion whileInView

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { SectionEyebrow } from '../../components/ui'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { DownloadsGridBlockProps, DownloadItem } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

function DownloadCard({
  item,
  downloadLabel,
}: {
  item: DownloadItem
  downloadLabel: string
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex h-full flex-col rounded-2xl border border-(--color-neutral-200) bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {item.categoryLabel && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--color-primary)">
          {item.categoryLabel}
        </p>
      )}
      <h3 className="mb-3 text-lg font-semibold text-(--color-text)">{item.title}</h3>
      {item.description && (
        <p className="mb-4 flex-1 text-sm leading-relaxed text-(--color-muted)">
          {item.description}
        </p>
      )}
      {item.meta && (
        <p className="mb-4 text-xs uppercase tracking-wider text-(--color-muted)">{item.meta}</p>
      )}
      <Link
        href={item.href}
        className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-primary) hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
        download
      >
        {downloadLabel}
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      </Link>
    </motion.div>
  )
}

export function DownloadsGridBlock({
  eyebrow,
  heading,
  intro,
  downloads,
  viewAllCta,
  downloadLabel = 'Free Download',
}: DownloadsGridBlockProps) {
  if (downloads.length === 0) return null

  const locale = useLocale()

  return (
    /* MODIFIED: Added external top margins (mt-12 md:mt-16) to push down away from the previous blue curved section */
    <section 
      aria-labelledby="downloads-heading" 
      className="bg-white pt-5 pb-20 lg:pt-10 lg:pb-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header — centered */}
        <div className="mb-12 text-center">
          {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
          {heading && (
            <h2
              id="downloads-heading"
              className="mt-4 text-3xl font-bold text-(--color-text) md:text-4xl tracking-tight"
            >
              {heading}
            </h2>
          )}
          {intro && (
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-(--color-muted)">
              {intro}
            </p>
          )}
        </div>

        {/* Cards grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {downloads.map((item, i) => (
            <DownloadCard key={i} item={item} downloadLabel={downloadLabel} />
          ))}
        </motion.div>

        {/* View all CTA */}
        {viewAllCta && (
          <div className="mt-10 text-center">
            <Link
              href={withLocale(locale, viewAllCta.href)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-primary) hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
            >
              {viewAllCta.label}
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}