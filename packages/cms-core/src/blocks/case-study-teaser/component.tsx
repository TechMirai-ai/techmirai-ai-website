'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/motion'
import type { CaseStudyTeaserBlockProps } from './types'

export function CaseStudyTeaserBlock({
  heading,
  body,
  statsStrip,
  note,
  buttonLabel,
  buttonHref,
  visible,
}: CaseStudyTeaserBlockProps) {
  if (!visible || !heading) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        className="mx-auto max-w-4xl rounded-2xl border border-border-default bg-bg-tertiary p-6 md:p-8 flex flex-col gap-4"
      >
        <h2 className="text-2xl md:text-[28px] font-bold tracking-tight text-text-primary leading-[1.2]">
          {heading}
        </h2>
        {body && <p className="text-[13.5px] md:text-[15px] leading-relaxed text-text-muted">{body}</p>}
        {statsStrip && (
          <p className="text-[13px] md:text-[13.5px] font-semibold text-brand-primary-dark">{statsStrip}</p>
        )}
        {note && <p className="text-[12.5px] text-text-secondary">{note}</p>}
        {buttonLabel && buttonHref && (
          <div>
            <Link
              href={buttonHref}
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
