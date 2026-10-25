'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/motion'
import type { PricingTeaserBlockProps } from './types'

export function PricingTeaserBlock({
  heading,
  packageName,
  priceLine1,
  priceLine2,
  includesList,
  note,
  buttonLabel,
  buttonHref,
}: PricingTeaserBlockProps) {
  if (!heading || !packageName) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-bg-tertiary">
      <div className="mx-auto max-w-3xl text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
          {heading}
        </h2>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        className="mx-auto max-w-md rounded-2xl border border-border-default bg-white p-6 md:p-8 shadow-sm flex flex-col gap-3"
      >
        <h3 className="text-[16px] font-bold text-text-primary leading-snug">{packageName}</h3>
        <div className="flex flex-col gap-1">
          <p className="text-[20px] font-bold text-brand-accent leading-snug">{priceLine1}</p>
          <p className="text-[20px] font-bold text-brand-accent leading-snug">{priceLine2}</p>
        </div>
        {includesList && (
          <p className="text-[13px] leading-relaxed text-text-muted">{includesList}</p>
        )}
        {note && <p className="text-[12px] text-text-secondary">{note}</p>}
        {buttonLabel && buttonHref && (
          <Link
            href={buttonHref}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2.5 text-[13.5px] font-semibold text-on-primary hover:opacity-90 transition-opacity"
          >
            {buttonLabel}
          </Link>
        )}
      </motion.div>
    </section>
  )
}
