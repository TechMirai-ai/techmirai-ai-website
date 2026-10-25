'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { ToolsCompatibilityBlockProps } from './types'

export function ToolsCompatibilityBlock({
  heading,
  body,
  col1Title,
  col1List,
  col2Title,
  col2List,
  col3Title,
  col3Body,
  linkLabel,
  linkHref,
}: ToolsCompatibilityBlockProps) {
  if (!heading) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white">
      <div className="mx-auto max-w-5xl text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
          {heading}
        </h2>
        {body && (
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] md:text-[15px] leading-relaxed text-text-muted font-normal">
            {body}
          </p>
        )}
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
      >
        <motion.div
          variants={fadeInUp}
          className="rounded-xl border border-border-default bg-bg-tertiary p-5 flex flex-col gap-2"
        >
          <h3 className="text-[14.5px] font-bold text-brand-primary-dark leading-snug">{col1Title}</h3>
          {col1List && <p className="text-[13px] leading-relaxed text-text-muted">{col1List}</p>}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="rounded-xl border border-border-default bg-bg-tertiary p-5 flex flex-col gap-2"
        >
          <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{col2Title}</h3>
          {col2List && <p className="text-[13px] leading-relaxed text-text-muted">{col2List}</p>}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="rounded-xl border border-border-default bg-bg-tertiary p-5 flex flex-col gap-2"
        >
          <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{col3Title}</h3>
          {col3Body && <p className="text-[13px] leading-relaxed text-text-muted">{col3Body}</p>}
        </motion.div>
      </motion.div>

      {linkLabel && linkHref && (
        <div className="mx-auto max-w-5xl mt-6 text-center">
          <Link
            href={linkHref}
            className="text-[13.5px] font-semibold text-brand-primary-dark hover:underline underline-offset-2"
          >
            {linkLabel} →
          </Link>
        </div>
      )}
    </section>
  )
}
