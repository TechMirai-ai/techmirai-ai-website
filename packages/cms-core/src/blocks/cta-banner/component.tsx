'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Mail, PhoneCall, ArrowRight, MessageSquare } from 'lucide-react'
import { fadeInUp } from '../../lib/motion'
import type { CTABannerBlockProps } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

export function CTABannerBlock({
  eyebrow = 'Contact',
  heading = 'inquiry',
  body,
  primaryButton,
}: CTABannerBlockProps) {
  const locale = useLocale()
  return (
    <section className="bg-white py-16 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">

        {/* Outer wrapper — relative for the overlapping card layout structure */}
        <div className="relative flex flex-col lg:flex-row lg:items-center">

          {/* ── LEFT: Main Visual Card ── */}
          {/* MODIFIED: Expanded widths from lg:w-[62%] up to lg:w-[72%] to open left-side landscape footprint */}
          <div className="w-full lg:w-[72%] min-h-[320px] lg:min-h-[400px]
                          bg-brand-primary relative rounded-2xl lg:rounded-3xl overflow-hidden
                          flex items-center shadow-sm z-0">

            {/* Background pattern — subtle grid lines */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-white"
                  style={{ left: `${(i + 1) * 16.66}%` }}
                />
              ))}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 h-px bg-white"
                  style={{ top: `${(i + 1) * 25}%` }}
                />
              ))}
            </div>

            {/* Decorative icon blocks row */}
            {/* MODIFIED: Adjusted padding distributions to balance out the extra available horizontal workspace layout */}
            <div className="relative z-10 flex items-center 
                            justify-center gap-8 md:gap-14 lg:gap-16 
                            w-full px-6 md:px-16 lg:pr-36">
              
              {/* Mail icon box */}
              <div className="flex flex-col items-center gap-3">
                {/* MODIFIED: Converted to a smooth circular container to perfectly mirror your navigation framework */}
                <div className="flex h-16 w-16 md:h-20 md:w-20 
                                items-center justify-center 
                                bg-white/10 border border-white/20
                                rounded-full text-white backdrop-blur-sm">
                  <Mail className="w-7 h-7 md:w-9 md:h-9" 
                        strokeWidth={1.2} />
                </div>
                <span className="text-white/90 text-[10px] md:text-xs font-semibold 
                                 tracking-widest uppercase">
                  Email
                </span>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-white/20 hidden sm:block" />

              {/* Phone icon box */}
              <div className="flex flex-col items-center gap-3">
                {/* MODIFIED: Converted to matching circle layout */}
                <div className="flex h-16 w-16 md:h-20 md:w-20 
                                items-center justify-center 
                                bg-white/10 border border-white/20
                                rounded-full text-white backdrop-blur-sm">
                  <PhoneCall className="w-7 h-7 md:w-9 md:h-9" 
                              strokeWidth={1.2} />
                </div>
                <span className="text-white/90 text-[10px] md:text-xs font-semibold 
                                 tracking-widest uppercase">
                  Phone
                </span>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-white/20 hidden sm:block" />

              {/* Chat icon box */}
              <div className="flex flex-col items-center gap-3">
                {/* MODIFIED: Converted to matching circle layout */}
                <div className="flex h-16 w-16 md:h-20 md:w-20 
                                items-center justify-center 
                                bg-white/10 border border-white/20
                                rounded-full text-white backdrop-blur-sm">
                  <MessageSquare className="w-7 h-7 md:w-9 md:h-9" 
                                  strokeWidth={1.2} />
                </div>
                <span className="text-white/90 text-[10px] md:text-xs font-semibold 
                                 tracking-widest uppercase">
                  Chat
                </span>
              </div>

            </div>
          </div>

          {/* ── RIGHT: Floating Overlap Card ── */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="relative z-20
                       w-full lg:absolute lg:right-0 lg:left-auto
                       lg:w-[42%]
                       -mt-10 lg:mt-0
                       px-4 sm:px-10 lg:px-0"
          >
            <div className="bg-bg-tertiary border border-border-default
                            shadow-xl rounded-2xl lg:rounded-3xl
                            p-8 md:p-10 lg:p-12
                            flex flex-col justify-center
                            min-h-[300px] lg:min-h-[350px]">

              

              {/* Heading */}
              <h2 className="text-2xl md:text-3xl font-bold 
                             tracking-tight text-text-primary 
                             leading-tight">
                {heading}
              </h2>

              {/* Accent line */}
              <div className="mt-3 mb-4 h-0.5 w-8 bg-brand-primary" />

              {/* Body */}
              {body && (
                <p className="text-[14px] md:text-[15px] leading-relaxed 
                              text-text-muted font-normal tracking-wide">
                  {body}
                </p>
              )}

              {/* CTA Button */}
              {primaryButton?.label && (
                <div className="mt-6">
                  <Link
                    href={withLocale(locale, primaryButton.href)}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary
                              px-6 py-2.5 text-sm font-semibold tracking-wider text-white shadow-sm
                              transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-md"
                  >
                    <span>{primaryButton.label}</span>
                    <ArrowRight 
                      size={14} 
                      className="transition-transform duration-200 
                                 group-hover:translate-x-1" 
                    />
                  </Link>
                </div>
              )}

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  )
}