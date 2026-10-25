'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SectionEyebrow, Badge } from '../../../../components/ui'
import { staggerContainer, fadeInUp } from '../../../../lib/motion'
import type { DoctorGridBlockProps, DoctorCardItem } from './types'

const YEARS_EXPERIENCE_LABEL: Record<'en' | 'ja', (years: number) => string> = {
  en: (years) => `${years}+ years experience`,
  ja: (years) => `臨床経験${years}年以上`,
}

export function DoctorGridBlock({ eyebrow, heading, subheadline, doctors, showBio }: DoctorGridBlockProps) {
  const rawLocale = useLocale()
  const locale: 'en' | 'ja' = rawLocale === 'ja' ? 'ja' : 'en'

  if (doctors.length === 0) return null

  // First doctor acts as Director, remaining 3 act as Staff
  const director = doctors[0]
  const staffMembers = doctors.slice(1, 4)

  return (
    <section aria-labelledby="doctor-grid-heading" className="w-full bg-brand-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {(eyebrow || heading || subheadline) && (
          <div className="mb-12 text-center mx-auto max-w-2xl space-y-2">
            {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
            {heading && (
              <h2 id="doctor-grid-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800">
                {heading}
              </h2>
            )}
            {subheadline && (
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                {subheadline}
              </p>
            )}
          </div>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="space-y-10"
        >
          {/* 1. DIRECTOR FEATURED PORTRAIT CARD */}
          {director && (
            <motion.div
              variants={fadeInUp}
              className="overflow-hidden rounded-3xl bg-white border border-[#eedad5] shadow-xs"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                {/* Director Photo with Green Shade Overlay */}
                <div className="group relative lg:col-span-7 min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] w-full bg-[#E6F4EA] overflow-hidden cursor-pointer">
                  {director.photoUrl ? (
                    <Image
                      src={director.photoUrl}
                      alt={director.name}
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-brand-primary-dark">
                      {director.name.charAt(0)}
                    </div>
                  )}

                  {/* Green Tint Overlay with Dynamic "Know more about [Name]" text */}
                  <div className="absolute inset-0 bg-brand-primary-dark/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-8 text-center text-white">
                    <p className="text-base sm:text-xl tracking-tight transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                      <span>Know more about {director.name}</span>
                      <ArrowRight className="w-5 h-5 shrink-0" />
                    </p>
                  </div>
                </div>

                {/* Director Info Container */}
                <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-4 text-left">
                  

                  <div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {director.name}
                    </h3>
                    {director.title && (
                      <p className="text-sm sm:text-base font-medium text-brand-primary-dark mt-1">
                        {director.title}
                      </p>
                    )}
                  </div>

                  {director.yearsOfExperience !== undefined && (
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 tabular-nums">
                      {YEARS_EXPERIENCE_LABEL[locale](director.yearsOfExperience)}
                    </p>
                  )}

                  {director.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {director.specialties.map((specialty) => (
                        <Badge key={specialty} variant="accent">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {showBio && director.bio && (
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 pt-2 line-clamp-4">
                      {director.bio}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. STAFF MEMBERS (3 SMALLER CARDS) */}
          {staffMembers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {staffMembers.map((staff) => (
                <motion.div
                  key={staff.id}
                  variants={fadeInUp}
                  className="group overflow-hidden rounded-2xl bg-white border border-[#eedad5] shadow-xs transition-all duration-200"
                >
                  {/* Staff Photo with Green Shade Overlay */}
                  <div className="relative h-64 sm:h-72 w-full bg-[#E6F4EA] overflow-hidden cursor-pointer">
                    {staff.photoUrl ? (
                      <Image
                        src={staff.photoUrl}
                        alt={staff.name}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-primary-dark">
                        {staff.name.charAt(0)}
                      </div>
                    )}

                    {/* Green Tint Overlay with Dynamic "Know more about [Name]" text */}
                    <div className="absolute inset-0 bg-brand-primary-dark/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-5 text-center text-white">
                      <p className="text-xs sm:text-sm font-bold tracking-tight transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-1.5 leading-snug">
                        <span>Know more about {staff.name}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </p>
                    </div>
                  </div>

                  <div className="p-5 text-left space-y-1.5">
                    <h4 className="text-lg font-bold text-slate-800 tracking-tight">
                      {staff.name}
                    </h4>

                    {staff.title && (
                      <p className="text-xs font-semibold text-brand-primary-dark">
                        {staff.title}
                      </p>
                    )}

                    {showBio && staff.bio && (
                      <p className="text-xs text-slate-600 leading-snug line-clamp-2 pt-1">
                        {staff.bio}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}