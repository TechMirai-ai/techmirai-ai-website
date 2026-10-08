'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { ProcessStepsBlockProps } from './types'

export function ProcessStepsBlock({ heading, sub, steps }: ProcessStepsBlockProps) {
  if (!steps || steps.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-bg-tertiary">
      <div className="mx-auto max-w-5xl text-center mb-8 md:mb-10">
        {heading && (
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
            {heading}
          </h2>
        )}
        {sub && (
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] md:text-[15px] leading-relaxed text-text-muted font-normal">
            {sub}
          </p>
        )}
      </div>

      <motion.ol
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
      >
        {steps.map((step, i) => (
          <motion.li
            key={i}
            variants={fadeInUp}
            className="rounded-xl border border-border-default bg-white p-5 shadow-sm flex flex-col gap-2"
          >
            <span className="block text-[32px] font-bold tracking-tight text-brand-primary/25 leading-none font-sans select-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            {step.title && (
              <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{step.title}</h3>
            )}
            <p className="text-[13px] leading-relaxed text-text-muted">{step.line}</p>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  )
}
