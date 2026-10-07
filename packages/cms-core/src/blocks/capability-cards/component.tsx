'use client'

import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { CapabilityCardsBlockProps, CapabilityStatus } from './types'

// Spec §5.4's own glossary (lines 239-240 of the Content Spec): these two
// status values are fixed, site-wide wording — never store them as free
// text per-card, so a wording change only has to happen in one place.
const STATUS_LABELS: Record<CapabilityStatus, { en: string; ja: string }> = {
  available: { en: 'Available now', ja: '提供中' },
  'in-development': { en: 'In development', ja: '開発中' },
}

export function CapabilityCardsBlock({
  heading,
  intro,
  cards,
  badgeRow,
  splitHeading,
  splitLeftTitle,
  splitLeftItems,
  splitRightTitle,
  splitRightItems,
  splitClosingLine,
}: CapabilityCardsBlockProps) {
  const locale = useLocale()
  const isJa = locale === 'ja'

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

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
      >
        {cards.map((card, i) => {
          const statusLabel = STATUS_LABELS[card.status]
          const isAvailable = card.status === 'available'
          return (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="rounded-xl border border-border-default bg-white p-5 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{card.label}</h3>
                <span
                  className={[
                    'shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold whitespace-nowrap',
                    isAvailable ? 'bg-brand-primary-light text-brand-primary' : 'bg-brand-accent/15 text-brand-accent-hover',
                  ].join(' ')}
                >
                  {isJa ? statusLabel.ja : statusLabel.en}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-text-muted">{card.description}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {badgeRow && (
        <p className="mx-auto max-w-3xl mt-6 md:mt-8 text-center text-[12.5px] md:text-[13.5px] font-medium text-text-secondary">
          {badgeRow}
        </p>
      )}

      {(splitLeftItems?.length || splitRightItems?.length) && (
        <div className="mx-auto max-w-5xl mt-12 md:mt-16">
          {splitHeading && (
            <h3 className="text-xl md:text-2xl font-bold text-text-primary text-center mb-6 md:mb-8">
              {splitHeading}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="rounded-2xl border border-border-default bg-bg-tertiary p-5 md:p-6">
              {splitLeftTitle && (
                <h4 className="text-[15px] font-bold text-brand-primary mb-3">{splitLeftTitle}</h4>
              )}
              <ul className="flex flex-col gap-2">
                {splitLeftItems?.map((item, i) => (
                  <li key={i} className="text-[13.5px] text-text-primary leading-relaxed">
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border-default bg-white p-5 md:p-6 shadow-sm">
              {splitRightTitle && (
                <h4 className="text-[15px] font-bold text-text-primary mb-3">{splitRightTitle}</h4>
              )}
              <ul className="flex flex-col gap-2">
                {splitRightItems?.map((item, i) => (
                  <li key={i} className="text-[13.5px] text-text-primary leading-relaxed">
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {splitClosingLine && (
            <p className="mx-auto max-w-2xl mt-6 text-center text-[13.5px] md:text-[14.5px] text-text-secondary font-medium">
              {splitClosingLine}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
