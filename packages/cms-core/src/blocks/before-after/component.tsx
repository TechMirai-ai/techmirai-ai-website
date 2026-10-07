'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { BeforeAfterBlockProps } from './types'

export function BeforeAfterBlock({
  heading,
  sub,
  beforeLabel,
  afterLabel,
  rows,
}: BeforeAfterBlockProps) {
  if (!rows || rows.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-bg-tertiary">
      <div className="mx-auto max-w-5xl text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
          {heading}
        </h2>
        {sub && (
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] md:text-[15px] leading-relaxed text-text-muted font-normal">
            {sub}
          </p>
        )}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-default bg-bg-secondary">
              <th className="py-3 px-4 text-[13px] font-semibold text-text-muted w-[26%]"> </th>
              <th className="py-3 px-4 text-[13px] font-semibold text-text-secondary">{beforeLabel}</th>
              <th className="py-3 px-4 text-[13px] font-semibold text-brand-primary">{afterLabel}</th>
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {rows.map((row, i) => (
              <motion.tr key={i} variants={fadeInUp} className="border-b border-border-default last:border-b-0">
                <td className="py-3 px-4 text-[13.5px] font-semibold text-text-primary align-top">{row.area}</td>
                <td className="py-3 px-4 text-[13.5px] text-text-muted align-top">{row.before}</td>
                <td className="py-3 px-4 text-[13.5px] text-text-primary font-medium align-top bg-brand-primary-light/40">
                  {row.after}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="md:hidden mx-auto max-w-5xl flex flex-col gap-3"
      >
        {rows.map((row, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            className="rounded-xl border border-border-default bg-white p-4 shadow-sm"
          >
            <p className="text-[13.5px] font-semibold text-text-primary mb-2">{row.area}</p>
            <div className="flex flex-col gap-1.5">
              <p className="text-[12.5px] text-text-muted">
                <span className="font-medium text-text-secondary">{beforeLabel}: </span>
                {row.before}
              </p>
              <p className="text-[12.5px] text-text-primary font-medium">
                <span className="font-semibold text-brand-primary">{afterLabel}: </span>
                {row.after}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
