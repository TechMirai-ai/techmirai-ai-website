'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { LabelValueListBlockProps } from './types'

export function LabelValueListBlock({ heading, intro, rows, footnote }: LabelValueListBlockProps) {
  if (!rows || rows.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white">
      {(heading || intro) && (
        <div className="mx-auto max-w-5xl text-center mb-8 md:mb-10">
          {heading && (
            <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
              {heading}
            </h2>
          )}
          {intro && (
            <p className="mx-auto mt-3 max-w-2xl text-[13.5px] md:text-[15px] leading-relaxed text-text-muted font-normal">
              {intro}
            </p>
          )}
        </div>
      )}

      <motion.ul
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto max-w-3xl flex flex-col gap-3"
      >
        {rows.map((row, i) => (
          <motion.li
            key={i}
            variants={fadeInUp}
            className="rounded-xl border border-border-default bg-bg-tertiary p-4 flex flex-col gap-1.5"
          >
            <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{row.label}</h3>
            <p className="text-[13px] leading-relaxed text-text-muted">{row.detail}</p>
          </motion.li>
        ))}
      </motion.ul>

      {footnote && (
        <p className="mx-auto max-w-2xl mt-6 text-center text-[13.5px] md:text-[14.5px] text-text-secondary font-medium">
          {footnote}
        </p>
      )}
    </section>
  )
}
