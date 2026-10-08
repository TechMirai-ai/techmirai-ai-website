'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { NewsListBlockProps, NewsItem } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('[')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

function formatDateToDot(dateString?: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

export function NewsListBlock({ heading, items, viewAllCta }: NewsListBlockProps) {
  const locale = useLocale()

  if (!items || items.length === 0) return null

  // Sort latest first and show top 3 items
  const sortedItems = [...items]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 3)

  return (
    <section className="bg-brand-surface py-16 md:py-24 w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12 items-start">

          {/* Left Column: Logo & Heading (All Centered & Tight Gap) */}
          <div className="md:col-span-3 flex flex-col items-center justify-center text-center pt-1 w-full">
            <div className="flex items-center justify-center mb-1">
              <Image
                src="/brand/logo3.png"
                alt="Brand icon"
                width={32}
                height={32}
                className="w-9 h-9 object-contain mx-auto"
              />
            </div>
            <h2 className="text-3xl md:text-4xl mt-3 font-extrabold tracking-tight text-brand-primary leading-none text-center">
              {heading}
            </h2>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 text-center block -mt-5">
              {/* Inline locale check matching your pattern */}
              {locale === 'ja' ? 'お知らせ' : 'NEWS'}
            </span>
          </div>

          {/* Right Column: News Items & Bottom CTA */}
          <div className="md:col-span-9 flex flex-col justify-between space-y-6">
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-20px' }}
              role="list"
              className="space-y-6"
            >
              {sortedItems.map((item: NewsItem, i: number) => (
                <motion.li key={item.headline || i} variants={fadeInUp} className="list-none">
                  <Link
                    href={withLocale(locale, item.href)}
                    className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-left focus-visible:outline-none"
                  >
                    {/* Mobile Top Row: Pill Badge + Date side by side */}
                    <div className="flex items-center gap-4 shrink-0 sm:contents">
                      {/* Pill Badge */}
                      {item.category && (
                        <span className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-1 text-xs text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-200 shrink-0 min-w-[80px] text-center sm:order-2">
                          {item.category.toLowerCase()}
                        </span>
                      )}

                      {/* Date */}
                      {item.date && (
                        <span className="text-sm font-semibold text-gray-500 tabular-nums shrink-0 min-w-[95px] sm:order-1">
                          {formatDateToDot(item.date)}
                        </span>
                      )}
                    </div>

                    {/* Headline: Placed on a new line on mobile, inline on desktop */}
                    <span className="text-sm sm:text-base text-gray-900 group-hover:text-brand-primary transition-colors duration-150 line-clamp-2 sm:line-clamp-1 sm:order-3">
                      {item.headline}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>

            {/* Bottom Right CTA Link */}
            {viewAllCta && (
              <div className="flex justify-end pt-4">
                <Link
                  href={withLocale(locale, viewAllCta.href)}
                  className="group inline-flex items-center gap-3 text-sm text-gray-900 hover:text-brand-primary transition-colors"
                >
                  <span>
                    {viewAllCta.label || (locale === 'ja' ? 'お知らせ一覧' : 'List of announcements')}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white border border-brand-primary group-hover:bg-white group-hover:text-brand-primary transition-all duration-200 group-hover:scale-110">
                    →
                  </span>
                </Link>
              </div>
            )}
          </div>

        </div>
        <div className="mt-16 w-full border-b border-dashed" style={{ borderColor: '#EE7A93' }} />
      </div>
    </section>
  )
}