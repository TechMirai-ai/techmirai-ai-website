'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import type { ImageTextSplitBlockProps } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

const bgMap: Record<string, string> = {
  white: 'bg-white',
  light: 'bg-[var(--color-neutral-50,#fafafa)]',
  dark: 'bg-[var(--color-neutral-900)]',
}

const textColorMap: Record<string, string> = {
  white: 'text-[var(--color-text)]',
  light: 'text-[var(--color-text)]',
  dark: 'text-white',
}

const splitColsMap: Record<string, { image: string; text: string }> = {
  '40/60': { image: 'lg:col-span-5', text: 'lg:col-span-7' },
  '50/50': { image: 'lg:col-span-6', text: 'lg:col-span-6' },
  '60/40': { image: 'lg:col-span-7', text: 'lg:col-span-5' },
}

export function ImageTextSplitBlock({
  imageUrl,
  imageAlt,
  imagePosition = 'left',
  eyebrow,
  heading,
  body,
  primaryButtonLabel,
  primaryButtonHref,
  imageSplit = '50/50',
  backgroundStyle = 'white',
  verticalAlign = 'center',
}: ImageTextSplitBlockProps) {
  const locale = useLocale()
  const bg = bgMap[backgroundStyle] ?? bgMap['white']
  const textColor = textColorMap[backgroundStyle] ?? textColorMap['white']
  const isDark = backgroundStyle === 'dark'
  const cols = splitColsMap[imageSplit] ?? { image: 'lg:col-span-6', text: 'lg:col-span-6' }
  const alignItems = verticalAlign === 'top' ? 'items-start' : 'items-center'

  // Animation variant for the image to gracefully slide in from the right edge
  const imageVariants = {
    hidden: { opacity: 0, x: 45 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.75, ease: [0.25, 1, 0.5, 1] }
    }
  }

  // Animation variant for the text block to gently approach from the left side
  const textVariants = {
    hidden: { opacity: 0, x: -35 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.75, ease: [0.25, 1, 0.5, 1] }
    }
  }

  const imageCol = (
    <motion.div 
      variants={imageVariants}
      className={`${cols.image} overflow-hidden rounded-2xl`}
    >
      <Image
        src={imageUrl}
        alt={imageAlt}
        width={800}
        height={600}
        className="h-full w-full object-cover"
      />
    </motion.div>
  )

  const textCol = (
    <motion.div 
      variants={textVariants}
      className={`${cols.text} flex flex-col justify-center gap-5 ${textColor}`}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className={`text-base leading-relaxed ${isDark ? 'text-white/80' : 'text-[var(--color-muted)]'}`}>
        {body}
      </p>
      {primaryButtonLabel && primaryButtonHref && (
        <Link
          href={withLocale(locale, primaryButtonHref)}
          className="inline-flex w-fit min-h-[44px] items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
        >
          {primaryButtonLabel}
        </Link>
      )}
    </motion.div>
  )

  return (
    <section className={`pt-28 pb-16 md:pt-24 md:pb-24 overflow-hidden ${bg}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Changed layout wrapper to evaluate animation triggers collectively when viewed */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          className={`grid grid-cols-1 gap-10 lg:grid-cols-12 ${alignItems}`}
        >
          {imagePosition === 'left' ? (
            <>
              {imageCol}
              {textCol}
            </>
          ) : (
            <>
              {textCol}
              {imageCol}
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}