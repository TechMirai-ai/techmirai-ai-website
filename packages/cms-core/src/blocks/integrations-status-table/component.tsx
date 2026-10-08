'use client'

import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { IntegrationsStatusTableBlockProps, IntegrationStatus } from './types'

// Spec §8.2's own fixed glossary — these four status values are site-wide
// wording, never stored as free text per-row, so a wording change only has
// to happen in one place (same pattern as `capability-cards`' STATUS_LABELS).
const STATUS_LABELS: Record<IntegrationStatus, { en: string; ja: string }> = {
  available: { en: 'Available', ja: '提供中' },
  'case-by-case': { en: 'Case by case', ja: '個別にご相談' },
  'in-development': { en: 'In development', ja: '開発中' },
  'not-offered': { en: 'Not offered', ja: '対応していません' },
}

// Deliberately neutral for "not offered" (not error-red) — it is an honest
// fact, not a failure state.
const STATUS_BADGE_CLASSES: Record<IntegrationStatus, string> = {
  available: 'bg-brand-primary-light text-brand-primary',
  'case-by-case': 'bg-warning/10 text-warning',
  'in-development': 'bg-brand-accent/15 text-brand-accent-hover',
  'not-offered': 'bg-bg-tertiary text-text-muted border border-border-default',
}

export function IntegrationsStatusTableBlock({ heading, intro, rows, footnote }: IntegrationsStatusTableBlockProps) {
  const locale = useLocale()
  const isJa = locale === 'ja'

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
        {rows.map((row, i) => {
          const statusLabel = STATUS_LABELS[row.status]
          return (
            <motion.li
              key={i}
              variants={fadeInUp}
              className="rounded-xl border border-border-default bg-bg-tertiary p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{row.name}</h3>
                <span
                  className={[
                    'shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold whitespace-nowrap',
                    STATUS_BADGE_CLASSES[row.status],
                  ].join(' ')}
                >
                  {isJa ? statusLabel.ja : statusLabel.en}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-text-muted">{row.description}</p>
            </motion.li>
          )
        })}
      </motion.ul>

      {footnote && (
        <p className="mx-auto max-w-2xl mt-6 text-center text-[13.5px] md:text-[14.5px] text-text-secondary font-medium">
          {footnote}
        </p>
      )}
    </section>
  )
}
