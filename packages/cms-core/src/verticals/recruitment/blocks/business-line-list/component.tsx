'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import type { BusinessLineListBlockProps, BusinessLineItem } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

interface FeatureItem {
  id?: string
  text: string
}

interface ExtendedBusinessLineItem extends BusinessLineItem {
  features?: FeatureItem[]
}

// Animation Variants
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
  },
}

function RowItem({ item, index }: { item: ExtendedBusinessLineItem; index: number }) {
  const locale = useLocale()
  const hasImage = !!item.imageUrl
  const isImageLeft = item.imagePosition === 'left' || (item.imagePosition !== 'right' && index % 2 === 0)

  return (
    <motion.li 
      variants={itemVariants}
      className="w-full"
    >
      <div className={`grid grid-cols-1 gap-8 lg:gap-12 items-center ${hasImage ? 'lg:grid-cols-2' : 'w-full'}`}>

        {/* Image Side */}
        {hasImage && item.imageUrl && (
          <div className={`overflow-hidden rounded-3xl shadow-md ${isImageLeft ? 'lg:order-1' : 'lg:order-2'}`}>
            <Image
              src={item.imageUrl}
              alt={item.imageAlt ?? item.title ?? ''}
              width={700}
              height={520}
              className="w-full h-auto object-cover"
              priority={index === 0}
            />
          </div>
        )}

        {/* Content Side */}
        <div className={`flex flex-col ${hasImage && !isImageLeft ? 'lg:order-1' : 'lg:order-2'}`}>
          
          {item.eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-[2px] text-[var(--color-primary)] mb-3">
              {item.eyebrow}
            </p>
          )}

          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-4">
            {item.title}
          </h3>

          <div className="space-y-4 text-[15.5px] leading-relaxed text-gray-600">
            {item.description.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Features List */}
          {item.features && item.features.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {item.features.map((feature, idx) => (
                  <div key={feature.id ?? idx} className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button */}
          {item.ctaLabel && item.ctaHref && (
            <Link
              href={withLocale(locale, item.ctaHref)}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors group"
            >
              {item.ctaLabel}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          )}
        </div>

      </div>
    </motion.li>
  )
}

export function BusinessLineListBlock({
  heading,
  intro,
  items,
}: BusinessLineListBlockProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="pt-10 pb-16 md:pt-10 md:pb-24 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        {(heading || intro) && (
          <div className="text-center mb-12 md:mb-16">
            {heading && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                {heading}
              </h2>
            )}
            {intro && (
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                {intro}
              </p>
            )}
          </div>
        )}

        {/* Items List */}
        <motion.ul
          variants={listContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-16 md:space-y-20"
        >
          {items.map((item, i) => (
            <RowItem key={i} item={item} index={i} />
          ))}
        </motion.ul>

      </div>
    </section>
  )
}