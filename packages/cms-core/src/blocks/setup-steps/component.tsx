'use client'

import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { SetupStepsBlockProps } from './types'

// Structural column-header chrome, not Spec "fact" content (same precedent
// as `example-chat`'s hardcoded caption) — the Spec gives this phrase as a
// table column header, not a translatable sentence, so it is safe to
// hardcode the short JA label here without inventing new facts.
const NEED_LABEL: Record<string, string> = {
  en: 'What we need from you',
  ja: 'ご準備いただくもの',
}

export function SetupStepsBlock({ heading, sub, steps, footnote }: SetupStepsBlockProps) {
  const locale = useLocale()
  const needLabel = NEED_LABEL[locale] ?? NEED_LABEL['en']

  if (!steps || steps.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white">
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
        className="mx-auto max-w-3xl flex flex-col gap-3"
      >
        {steps.map((step, i) => (
          <motion.li
            key={i}
            variants={fadeInUp}
            className="rounded-xl border border-border-default bg-bg-tertiary p-5 flex flex-col gap-2"
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-[13px] font-bold text-brand-primary/50 leading-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{step.name}</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-text-muted">{step.description}</p>
            <div className="mt-1 pt-2 border-t border-border-default">
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                {needLabel}
              </span>
              <p className="mt-1 text-[13px] leading-relaxed text-text-primary">{step.need}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      {footnote && (
        <p className="mx-auto max-w-2xl mt-6 text-center text-[13.5px] md:text-[14.5px] text-text-secondary font-medium">
          {footnote}
        </p>
      )}
    </section>
  )
}
