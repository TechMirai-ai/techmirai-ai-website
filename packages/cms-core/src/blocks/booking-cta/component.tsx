'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarCheck } from 'lucide-react'
import { fadeInUp } from '../../lib/motion'
import type { BookingCtaBlockProps } from './types'

// External REQUEST link only — this does not implement in-house appointment
// scheduling. See packages/cms-core/src/blocks/booking-cta/config.ts.
export function BookingCtaBlock({ eyebrow, heading, subheadline, buttonLabel, note, bookingProviderUrl, enabled }: BookingCtaBlockProps) {
  if (!enabled || !bookingProviderUrl) return null

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-16">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="rounded-3xl bg-[var(--color-deep-accent)] px-8 py-12 md:px-16 md:py-16 text-center text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border border-white/20">
            <CalendarCheck className="h-6 w-6" aria-hidden="true" />
          </div>

          {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-white/70">{eyebrow}</p>}
          {heading && <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">{heading}</h2>}
          {subheadline && <p className="mt-3 text-[14px] md:text-[15.5px] leading-relaxed text-white/80 max-w-xl mx-auto">{subheadline}</p>}

          <div className="mt-8">
            <a
              href={bookingProviderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[var(--color-deep-accent)] shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <span>{buttonLabel}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {note && <p className="mt-4 text-[12px] text-white/60">{note}</p>}
        </motion.div>
      </div>
    </section>
  )
}
