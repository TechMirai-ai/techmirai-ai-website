'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/motion'
import type { ProductEditionBlockProps } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('[')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

export function ProductEditionBlock({
  heading,
  badge,
  body,
  itemsList,
  waysToStart,
  closingLine,
  buttonLabel,
  buttonHref,
}: ProductEditionBlockProps) {
  const locale = useLocale()

  if (!heading) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 bg-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        className="mx-auto max-w-4xl rounded-2xl border border-border-default bg-bg-tertiary p-6 md:p-8 flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary leading-[1.2]">{heading}</h2>
          {badge && (
            <span className="shrink-0 rounded-full bg-brand-accent/15 px-3 py-1 text-[11.5px] font-semibold text-brand-accent-hover whitespace-nowrap">
              {badge}
            </span>
          )}
        </div>

        {body && <p className="text-[13.5px] md:text-[14.5px] leading-relaxed text-text-muted">{body}</p>}
        {itemsList && <p className="text-[13px] leading-relaxed text-text-secondary font-medium">{itemsList}</p>}

        {waysToStart && waysToStart.length > 0 && (
          <ul className="flex flex-col gap-1.5 mt-1">
            {waysToStart.map((w, i) => (
              <li key={i} className="text-[13px] text-text-primary flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden="true" />
                {w.text}
              </li>
            ))}
          </ul>
        )}

        {closingLine && <p className="text-[13px] font-medium text-text-secondary mt-1">{closingLine}</p>}

        {buttonLabel && buttonHref && (
          <div className="mt-2">
            <Link
              href={withLocale(locale, buttonHref)}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2.5 text-[13.5px] font-semibold text-on-primary hover:opacity-90 transition-opacity"
            >
              {buttonLabel}
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  )
}
