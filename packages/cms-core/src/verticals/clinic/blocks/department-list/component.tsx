'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { SectionEyebrow } from '../../../../components/ui'
import { staggerContainer, fadeInUp } from '../../../../lib/motion'
import type { DepartmentListBlockProps, DepartmentCardItem } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

function FeatureColumn({ department }: { department: DepartmentCardItem }) {
  return (
    <motion.div 
      variants={fadeInUp} 
      className="flex flex-col items-center text-center space-y-4"
    >
      {/* Image with rounded corners */}
      <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
        {department.imageUrl ? (
          <Image
            src={department.imageUrl}
            alt={department.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <svg aria-hidden="true" className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Feature Title */}
      <h3 className="text-base md:text-lg font-bold text-slate-800 tracking-tight pt-2">
        {department.title}
      </h3>

      {/* Feature Description */}
      {department.excerpt && (
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-sm">
          {department.excerpt}
        </p>
      )}
    </motion.div>
  )
}

export function DepartmentListBlock({ eyebrow, heading, subheadline, departments }: DepartmentListBlockProps) {
  const locale = useLocale()

  if (!departments || departments.length === 0) return null

  return (
    <section aria-labelledby="department-list-heading" className="w-full bg-brand-surface pt-12 md:pt-16 pb-12 md:pb-20 overflow-hidden">
      
      {/* Blue/Green Section Wrapper */}
      <div className="relative w-full bg-[#BBDACD] pt-12 md:pt-16 pb-16 md:pb-20 px-4 md:px-8">
        
        {/* TOP: Scalloped Wave SVG */}
        <div className="absolute left-0 right-0 -top-[39px] md:-top-[79px] w-full overflow-hidden leading-none pointer-events-none">
          <svg
            className="relative block w-full h-[40px] md:h-[80px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,120 Q 150,20 300,120 Q 450,20 600,120 Q 750,20 900,120 Q 1050,20 1200,120 L 1200,120 L 0,120 Z"
              fill="#BBDACD"
            />
          </svg>
        </div>

        {/* Animated Container */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto max-w-6xl relative z-10"
        >
          {/* Header Section Reveal */}
          {(eyebrow || heading || subheadline) && (
            <motion.div variants={fadeInUp} className="mb-10 text-center mx-auto max-w-3xl px-4 space-y-2">
              {heading && (
                <h2 id="department-list-heading" className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  {heading}
                </h2>
              )}
            </motion.div>
          )}

          {/* 3 Columns Grid Staggered Reveal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-start">
            {departments.slice(0, 3).map((dept) => (
              <FeatureColumn key={dept.id} department={dept} />
            ))}
          </div>

          {/* Single Centered View Details Button Reveal */}
          <motion.div variants={fadeInUp} className="mt-12 text-center">
            <Link
              href={withLocale(locale, '/services')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs md:text-sm font-semibold text-slate-800 shadow-sm hover:shadow-md hover:border-brand-primary transition-all border border-slate-200/60 group"
            >
              <span>View details</span>
              <span aria-hidden="true" className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* BOTTOM: Heart-shaped Wave SVG */}
        <div className="absolute left-0 right-0 top-full -mt-px w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg
            className="relative block w-full h-[40px] md:h-[70px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 Q400,0 600,120 Q800,0 1200,0 L1200,0 L0,0 Z"
              fill="#BBDACD"
            />
          </svg>
        </div>

      </div>

      {/* Bottom spacing for smooth layout transition */}
      <div className="h-10 md:h-16 bg-brand-surface" />
    </section>
  )
}