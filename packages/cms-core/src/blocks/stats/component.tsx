'use client'
// Client boundary: counter-up animation on viewport entry (useInView + rAF)

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { SectionEyebrow } from '../../components/ui'
import type { StatsBlockProps, StatItem } from './types'

interface StatCounterProps {
  item: StatItem
  reducedMotion: boolean
}

function StatCounter({ item, reducedMotion }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(reducedMotion ? item.value : 0)

  useEffect(() => {
    // Skip animation: reduced motion or already at target
    if (reducedMotion || item.value === 0) {
      setCount(item.value)
      return
    }
    if (!isInView) return

    const duration = 2000
    let startTime: number | null = null

    function tick(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // cubic easeOut
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * item.value))
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    let rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isInView, item.value, reducedMotion])

  return (
    <div ref={ref} className="flex flex-col items-center text-center px-4 py-3 md:py-0">
      {/* Scaled down count text for a cleaner presentation */}
      <span className="text-5xl font-bold tracking-tight text-brand-dark md:text-6xl">
        {count.toLocaleString()}
        <span className="text-3xl font-bold ml-0.5 md:text-4xl">{item.suffix ?? '+'}</span>
      </span>
      <span className="mt-2 text-xs md:text-sm font-medium text-text-secondary tracking-tight">
        {item.label}
      </span>
    </div>
  )
}

export function StatsBlock({ eyebrow, sectionHeading, items }: StatsBlockProps) {
  const reducedMotion = useReducedMotion() ?? false

  if (items.length === 0) return null

  return (
    <section className="bg-brand-primary-light py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section header */}
        {(eyebrow || sectionHeading) && (
          <div className="mb-16 text-center max-w-3xl mx-auto space-y-3">
            {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
            {sectionHeading && (
              <p className="text-2xl font-extrabold tracking-tight text-(--color-text) md:text-3xl lg:text-4xl">
                {sectionHeading}
              </p>
            )}
          </div>
        )}

        {/* Clean Grid Layout with crisp line borders for a professional structure */}
        <div className="grid grid-cols-2 gap-y-8 divide-y divide-neutral-200/60 md:grid-cols-4 md:divide-y-0 md:divide-x">
          {items.map((item, i) => (
            <StatCounter key={i} item={item} reducedMotion={reducedMotion} />
          ))}
        </div>
      </div>
    </section>
  )
}