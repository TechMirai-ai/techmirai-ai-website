'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { ProblemSectionBlockProps } from './types'

export function ProblemSectionBlock({
  heading,
  intro,
  journeySteps,
  journeyCaption,
  cards,
  navyBandText,
  closingLine,
}: ProblemSectionBlockProps) {
  if (!cards || cards.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white">
      <div className="mx-auto max-w-5xl text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
          {heading}
        </h2>
        {intro && (
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] md:text-[15px] leading-relaxed text-text-muted font-normal">
            {intro}
          </p>
        )}
      </div>

      {journeySteps && journeySteps.length > 0 && (
        <div className="mx-auto max-w-4xl mb-10 md:mb-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            {journeySteps.map((step, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="rounded-full bg-bg-tertiary px-3 py-1.5 text-[12px] md:text-[13px] font-medium text-text-primary whitespace-nowrap">
                  {step.text}
                </span>
                {i < journeySteps.length - 1 && (
                  <span className="text-brand-primary/50" aria-hidden="true">
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
          {journeyCaption && (
            <p className="mt-3 text-[12px] md:text-[13px] italic text-text-muted">{journeyCaption}</p>
          )}
        </div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-10 md:mb-12"
      >
        {cards.map((card, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            className="rounded-xl border border-border-default bg-white p-5 shadow-sm"
          >
            <p className="text-[14px] leading-relaxed text-text-primary font-medium">{card.text}</p>
          </motion.div>
        ))}
      </motion.div>

      {navyBandText && (
        <div className="mx-auto max-w-5xl rounded-2xl bg-brand-dark px-6 py-8 md:py-10 text-center mb-6 md:mb-8">
          <p className="text-lg md:text-2xl font-semibold text-white leading-relaxed">{navyBandText}</p>
        </div>
      )}

      {closingLine && (
        <p className="mx-auto max-w-2xl text-center text-[14px] md:text-base text-text-secondary font-medium">
          {closingLine}
        </p>
      )}
    </section>
  )
}
