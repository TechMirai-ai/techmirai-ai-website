'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CaseStudiesGridBlockProps } from './types'

export function CaseStudiesGridBlock({
  eyebrow,
  heading,
  subheadline,
  button,
  studies = [],
}: CaseStudiesGridBlockProps) {
  const locale = useLocale()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (studies.length < 2) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % studies.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [studies.length])

  if (!studies || studies.length === 0) return null

  const numVisible = isMobile ? 1 : Math.min(3, studies.length)
  let visibleStudies = studies.slice(currentIndex, currentIndex + numVisible)
  if (visibleStudies.length < numVisible) {
    visibleStudies = [...visibleStudies, ...studies.slice(0, numVisible - visibleStudies.length)]
  }

  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + studies.length) % studies.length)
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % studies.length)

  const buttonLabel = button?.label ?? 'View all stories'
  const buttonHref = button?.href ?? '/case-studies'

  return (
    <section className="py-16 md:py-28 bg-bg-tertiary overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
          {/* LEFT SIDE */}
          <div className="md:col-span-2 space-y-4 md:space-y-6 min-w-0">
            {eyebrow && (
              <p className="text-sm font-semibold tracking-widest text-brand-primary uppercase">
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight break-words">
                {heading}
              </h2>
            )}

            {subheadline && (
              <p className="text-sm sm:text-base md:text-lg text-gray-600 break-words">
                {subheadline}
              </p>
            )}

            <Link
              href={`/${locale}${buttonHref}`}
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full font-medium transition-all text-sm md:text-base"
            >
              {buttonLabel} →
            </Link>
          </div>

          {/* RIGHT SIDE */}
          <div className="md:col-span-3 relative min-w-0">
            <div className="flex gap-4 md:gap-6 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {visibleStudies.map((study, idx) => {
                  const globalIdx = (currentIndex + idx) % studies.length
                  const isHovered = hoveredIndex === globalIdx

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="w-full md:min-w-[340px] md:w-auto flex-shrink-0 group relative"
                      onMouseEnter={() => setHoveredIndex(globalIdx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <Link
                        href={study.slug ? `/${locale}/case-studies/${encodeURIComponent(study.slug)}` : '#'}
                        className={`relative block rounded-3xl overflow-hidden shadow-lg aspect-[4/5] ${study.slug ? 'cursor-pointer' : 'cursor-default'}`}
                        aria-disabled={!study.slug}
                        onClick={(e) => { if (!study.slug) e.preventDefault() }}
                      >
                        {study.photoUrl ? (
                          <Image
                            src={study.photoUrl}
                            alt={study.name}
                            fill
                            className="object-cover transition-all duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">No Image</div>
                        )}

                        <div
                          className={`absolute inset-0 bg-blue-500/70 transition-all duration-500 flex flex-col items-center justify-center text-center p-6 md:p-8 ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          {study.tagline && (
                            <p className="text-white text-lg md:text-[22px] font-medium leading-tight max-w-[280px]">
                              {study.tagline}
                            </p>
                          )}
                        </div>

                        <div
                          className={`absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent text-white transition-all duration-500 ${
                            isHovered ? 'opacity-30' : 'opacity-100'
                          }`}
                        >
                          <h3 className="text-xl md:text-2xl font-bold tracking-tight">{study.name}</h3>
                          {study.role && <p className="text-xs md:text-sm opacity-90 mt-1">{study.role}</p>}
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {studies.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-1 md:-left-4 top-1/2 -translate-y-1/2 bg-white p-2.5 md:p-4 rounded-full shadow-xl border hover:bg-gray-50 z-10"
                >
                  <ChevronLeft size={18} className="md:hidden" />
                  <ChevronLeft size={24} className="hidden md:block" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-1 md:-right-4 top-1/2 -translate-y-1/2 bg-white p-2.5 md:p-4 rounded-full shadow-xl border hover:bg-gray-50 z-10"
                >
                  <ChevronRight size={18} className="md:hidden" />
                  <ChevronRight size={24} className="hidden md:block" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}