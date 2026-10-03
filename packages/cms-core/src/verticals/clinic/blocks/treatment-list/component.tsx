'use client'

import { useLocale } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../../../lib/motion'
import type { TreatmentListBlockProps } from './types'
import {
  Bone,
  Activity,
  UserCheck,
  HeartPulse,
  Stethoscope,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Bone,
  Activity,
  UserCheck,
  HeartPulse,
  Stethoscope,
  ShieldAlert,
}

function TreatmentIcon({ iconName }: { iconName?: string }) {
  if (!iconName) return null
  const IconComponent = ICON_MAP[iconName]
  if (!IconComponent) return null

  return <IconComponent className="w-12 h-12 text-[#2A9D8F] stroke-[1.75]" />
}

const COPY = {
  en: { mainAreas: 'Main areas we support' },
  ja: { mainAreas: '主な対応疾患・症状' },
}

export function TreatmentListBlock({ treatments }: TreatmentListBlockProps) {
  const rawLocale = useLocale()
  const locale: 'en' | 'ja' = rawLocale === 'ja' ? 'ja' : 'en'
  const t = COPY[locale]

  if (!treatments || treatments.length === 0) return null

  return (
    <section aria-labelledby="treatment-list-heading" className="w-full mb-10 md:mb-22">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {treatments.map((treatment, index) => {
          const isEven = index % 2 === 0
          const bgColor = isEven ? 'bg-[#F0F6F3]' : 'bg-brand-surface'

          return (
            <motion.div
              key={treatment.id}
              variants={fadeInUp}
              id={treatment.anchorId}
              className={`w-full py-12 md:py-16 scroll-mt-20 lg:scroll-mt-24 ${bgColor}`}
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-4 lg:px-6">

                {/* Accent Bar */}
                <div className="relative pt-4 mb-6 border-t border-[var(--color-border-default)]/60">
                  <div className="absolute top-0 left-0 h-1 w-12 bg-[#EE7A93] rounded-full" />
                </div>

                {/* Title Header */}
                <div className="text-2xl sm:text-3xl md:text-4xl text-brand-primary mb-6 tracking-tight font-semibold">
                  {treatment.heading}
                </div>

                {/* Icon + Content Layout */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start mb-8">
                  {(treatment.iconName || treatment.iconUrl) && (
                    <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow-sm border border-[var(--color-border-default)] flex items-center justify-center p-4">
                      {treatment.iconName ? (
                        <TreatmentIcon iconName={treatment.iconName} />
                      ) : treatment.iconUrl ? (
                        <Image
                          src={treatment.iconUrl}
                          alt=""
                          width={56}
                          height={56}
                          className="object-contain"
                        />
                      ) : null}
                    </div>
                  )}

                  <div className="flex-1 space-y-6">
                    {/* Concern Tags */}
                    {treatment.concernTags && treatment.concernTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {treatment.concernTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3.5 py-1.5 rounded-lg bg-[#EE7A93]/15 text-xs md:text-sm text-[var(--color-text)] font-medium cursor-default transition-all duration-200 hover:bg-[#EE7A93]/25 hover:shadow-sm hover:-translate-y-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description Text */}
                    {treatment.description && (
                      <p className="text-sm md:text-base leading-relaxed text-[var(--color-muted)] font-normal max-w-4xl">
                        {treatment.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Main Areas / Diseases Card Box */}
                {treatment.areas && treatment.areas.length > 0 && (
                  <div className="rounded-2xl border-2 border-[#EE7A93]/25 bg-white p-6 sm:p-8 shadow-[0_0_0_4px_rgba(238,122,147,0.1)]">
                    <h3 className="text-base md:text-lg font-bold text-[var(--color-text)] mb-6">
                      {t.mainAreas}
                    </h3>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                      {treatment.areas.map((area, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2.5 text-xs md:text-sm text-[var(--color-text)] pb-2 border-b border-dotted border-[var(--color-border-default)]"
                        >
                          <span className="w-2 h-2 rounded-full bg-brand-accent shrink-0" />
                          <span className="truncate">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}