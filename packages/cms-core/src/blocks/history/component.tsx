'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { HistoryBlockProps, HistoryEntry } from './types'

const accentDotMap: Record<string, string> = {
  brand: 'bg-[var(--color-primary)]',
  dark: 'bg-[var(--color-neutral-900)]',
  light: 'bg-[var(--color-neutral-400,#9ca3af)]',
}

const accentLineMap: Record<string, string> = {
  brand: 'bg-[var(--color-primary)]/30',
  dark: 'bg-[var(--color-neutral-900)]/30',
  light: 'bg-[var(--color-neutral-300,#d1d5db)]',
}

const accentTextMap: Record<string, string> = {
  brand: 'text-[var(--color-primary)]',
  dark: 'text-[var(--color-neutral-900)]',
  light: 'text-[var(--color-neutral-500,#6b7280)]',
}

const accentBadgeMap: Record<string, string> = {
  brand: 'bg-[var(--color-primary)] text-white',
  dark: 'bg-[var(--color-neutral-900)] text-white',
  light: 'bg-[var(--color-neutral-200,#e5e7eb)] text-[var(--color-text)]',
}

// Parent Stagger Preset
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

// Simple Mobile Fade-Up
const mobileItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
  },
}

// Center Line Scaling preset
const lineVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 0.8, ease: 'easeInOut' },
  },
}

// Spring Dot Preset
const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 15, delay: 0.2 },
  },
}

interface EntryCardProps {
  entry: HistoryEntry
  accentColor: string
  isRight?: boolean
}

function EntryCard({ entry, accentColor, isRight = false }: EntryCardProps) {
  const textClass = accentTextMap[accentColor] ?? accentTextMap['brand']
  const badgeClass = accentBadgeMap[accentColor] ?? accentBadgeMap['brand']

  return (
    <div className={`flex flex-col gap-2 ${isRight ? 'lg:items-end lg:text-right' : 'lg:items-start'}`}>
      {entry.badge && (
        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {entry.badge}
        </span>
      )}
      <div className={`text-sm font-bold ${textClass}`}>
        {entry.year}{entry.month ? `/${entry.month}` : ''}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">{entry.title}</h3>
      {entry.description.split('\n').filter(Boolean).map((para, i) => (
        <p key={i} className="text-sm leading-relaxed text-[var(--color-muted)]">{para}</p>
      ))}
      {entry.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-xl">
          <Image
            src={entry.imageUrl}
            alt={entry.imageAlt ?? entry.title}
            width={400}
            height={240}
            className="h-auto w-full max-w-xs object-cover"
          />
        </div>
      )}
    </div>
  )
}

function MobileEntry({ entry, accentColor }: { entry: HistoryEntry; accentColor: string }) {
  const dotClass = accentDotMap[accentColor] ?? accentDotMap['brand']
  const textClass = accentTextMap[accentColor] ?? accentTextMap['brand']
  const badgeClass = accentBadgeMap[accentColor] ?? accentBadgeMap['brand']

  return (
    <motion.li variants={mobileItemVariants} className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
        <div className={`w-px flex-1 ${accentLineMap[accentColor] ?? ''}`} />
      </div>
      <div className="flex flex-col gap-2 pb-2">
        {entry.badge && (
          <span className={`inline-block w-fit rounded-full px-3 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {entry.badge}
          </span>
        )}
        <p className={`text-sm font-bold ${textClass}`}>
          {entry.year}{entry.month ? `/${entry.month}` : ''}
        </p>
        <h3 className="text-base font-semibold text-[var(--color-text)]">{entry.title}</h3>
        {entry.description.split('\n').filter(Boolean).map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-[var(--color-muted)]">{para}</p>
        ))}
        {entry.imageUrl && (
          <Image
            src={entry.imageUrl}
            alt={entry.imageAlt ?? entry.title}
            width={320}
            height={200}
            className="mt-2 h-auto w-full max-w-xs rounded-xl object-cover"
          />
        )}
      </div>
    </motion.li>
  )
}

export function HistoryBlock({
  heading,
  intro,
  entries,
  layout = 'alternating',
  accentColor = 'brand',
}: HistoryBlockProps) {
  if (entries.length === 0) return null

  const lineClass = accentLineMap[accentColor] ?? accentLineMap['brand']

  return (
    <section className="pt-10 pb-16 md:pt-10 md:pb-24 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Animated Section Header */}
        {(heading || intro) && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            {heading && (
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
                {heading}
              </h2>
            )}
            {intro && (
              <p className="mt-4 mx-auto max-w-2xl text-base text-[var(--color-muted)]">{intro}</p>
            )}
          </motion.div>
        )}

        {/* Mobile Layout System */}
        <motion.ul 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="lg:hidden"
        >
          {entries.map((entry, i) => (
            <MobileEntry key={i} entry={entry} accentColor={accentColor} />
          ))}
        </motion.ul>

        {/* Desktop Layout System */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative hidden lg:block"
        >
          {/* Animated Center Timeline Line */}
          <motion.div 
            variants={lineVariants}
            className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 origin-top ${lineClass}`} 
          />

          <ol className="space-y-12">
            {entries.map((entry, i) => {
              const isRight = layout === 'alternating' ? i % 2 !== 0 : layout === 'right'

              // Directional translation variants depending on layout placement configuration
              const cardSideVariants = {
                hidden: { opacity: 0, x: isRight ? 40 : -40 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
                },
              }

              return (
                <li key={i} className="relative grid grid-cols-2 gap-8">
                  {isRight ? (
                    <>
                      <div />
                      <motion.div variants={cardSideVariants} className="relative pl-8">
                        <EntryCard entry={entry} accentColor={accentColor} isRight={false} />
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div variants={cardSideVariants} className="relative pr-8">
                        <EntryCard entry={entry} accentColor={accentColor} isRight={true} />
                      </motion.div>
                      <div />
                    </>
                  )}
                  
                  {/* Animated Springy Center Timeline Dot Marker */}
                  <motion.div 
                    variants={dotVariants}
                    className={`absolute left-1/2 top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white shadow-sm z-10 ${accentDotMap[accentColor] ?? accentDotMap['brand']}`} 
                  />
                </li>
              )
            })}
          </ol>
        </motion.div>
      </div>
    </section>
  )
}