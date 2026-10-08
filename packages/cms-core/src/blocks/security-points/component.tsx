'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { SecurityPointsBlockProps } from './types'

export function SecurityPointsBlock({ heading, points, buttonLabel, buttonHref }: SecurityPointsBlockProps) {
  if (!points || points.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white">
      <div className="mx-auto max-w-5xl text-center mb-8 md:mb-10">
        {heading && (
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
            {heading}
          </h2>
        )}
      </div>

      <motion.ul
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto max-w-3xl flex flex-col gap-3"
      >
        {points.map((point, i) => (
          <motion.li
            key={i}
            variants={fadeInUp}
            className="flex items-start gap-3 rounded-xl border border-border-default bg-bg-tertiary p-4"
          >
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden="true" />
            <p className="text-[13.5px] leading-relaxed text-text-primary">{point.text}</p>
          </motion.li>
        ))}
      </motion.ul>

      {buttonLabel && buttonHref && (
        <div className="mx-auto max-w-3xl mt-6 text-center">
          <Link
            href={buttonHref}
            className="text-[13.5px] font-semibold text-brand-primary hover:underline underline-offset-2"
          >
            {buttonLabel} →
          </Link>
        </div>
      )}
    </section>
  )
}
