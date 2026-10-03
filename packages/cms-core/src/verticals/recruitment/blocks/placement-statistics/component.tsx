'use client'

import { motion } from 'framer-motion'
import type { PlacementStatisticsBlockProps, IndustrySlice, RegionBar } from './types'

function bgClass(style: string): string {
  if (style === 'brand') return 'bg-[var(--color-primary)]'
  if (style === 'light') return 'bg-[var(--color-neutral-50,#fafafa)]'
  return 'bg-[var(--color-neutral-900)]'
}

function headingColor(style: string): string {
  return style === 'light' ? 'text-[var(--color-text)]' : 'text-white'
}

function labelColor(style: string): string {
  if (style === 'brand') return 'text-white/80'
  if (style === 'light') return 'text-[var(--color-muted)]'
  return 'text-white/70'
}

function subtitleColor(style: string): string {
  return style === 'brand' ? 'text-white/80' : 'text-[var(--color-primary)]'
}

// TODO: color token — pie chart slice colors — green monochromatic scale for data viz, not brand tokens
// These intentionally use a range of greens for distinguishable chart segments. Keep as-is.
const SLICE_COLORS = [
  '#22c55e', '#16a34a', '#15803d', '#166534',
  '#4ade80', '#86efac', '#bbf7d0', '#dcfce7',
  '#f0fdf4', '#6ee7b7',
]

interface PieSlice {
  name: string
  percentage: number
  color: string
  startAngle: number
  endAngle: number
}

function buildPieSlices(industries: IndustrySlice[]): PieSlice[] {
  const total = industries.reduce((s, i) => s + i.percentage, 0) || 100
  let cursor = -Math.PI / 2
  return industries.map((ind, idx) => {
    const sweep = (ind.percentage / total) * 2 * Math.PI
    const slice: PieSlice = {
      name: ind.name,
      percentage: ind.percentage,
      color: SLICE_COLORS[idx % SLICE_COLORS.length] ?? '#22c55e',
      startAngle: cursor,
      endAngle: cursor + sweep,
    }
    cursor += sweep
    return slice
  })
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

// Shared list fade-in variants
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemFadeVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
}

function PieChart({ industries, labelColor }: { industries: IndustrySlice[]; labelColor: string }) {
  const slices = buildPieSlices(industries)
  const cx = 100
  const cy = 100
  const r = 80

  return (
    <div className="flex flex-col gap-4 items-center">
      {/* Scale-up animation for the main SVG container */}
      <motion.svg 
        initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
        whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        viewBox="0 0 200 200" 
        className="w-48 h-48 md:w-56 md:h-56" 
        aria-hidden="true"
      >
        {slices.map((slice, i) => (
          <path key={i} d={arcPath(cx, cy, r, slice.startAngle, slice.endAngle)} fill={slice.color} />
        ))}
      </motion.svg>
      
      <motion.ul 
        variants={listVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col gap-1.5 w-full" 
        role="list"
      >
        {slices.map((slice, i) => (
          <motion.li key={i} variants={itemFadeVariants} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
              aria-hidden="true"
            />
            <span className={labelColor}>{slice.name}</span>
            <span className={`ml-auto font-semibold ${labelColor}`}>{slice.percentage}%</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}

function BarChart({ regions, labelColor }: { regions: RegionBar[]; labelColor: string }) {
  const maxVal = Math.max(...regions.map((r) => r.value), 1)

  return (
    <motion.ul 
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="flex flex-col gap-4 w-full" 
      role="list"
    >
      {regions.map((region, i) => {
        const pct = Math.round((region.value / maxVal) * 100)
        return (
          <motion.li key={i} variants={itemFadeVariants}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`text-xs font-medium ${labelColor}`}>{region.name}</span>
              <span className={`text-xs font-semibold ${labelColor}`}>{region.value}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
              {/* Width fill bar layout calculation handled seamlessly with springs */}
              <motion.div
                className="h-full rounded-full bg-[var(--color-primary)]"
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                role="presentation"
              />
            </div>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}

export function PlacementStatisticsBlock({
  heading,
  subtitle,
  backgroundStyle = 'dark',
  industriesHeading,
  industries,
  regionsHeading,
  regions,
}: PlacementStatisticsBlockProps) {
  if (industries.length === 0 && regions.length === 0) return null

  const bg            = bgClass(backgroundStyle)
  const hColor        = headingColor(backgroundStyle)
  const lColor        = labelColor(backgroundStyle)
  const sColor        = subtitleColor(backgroundStyle)

  return (
    <section className={`py-16 md:py-24 ${bg} overflow-hidden`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(heading || subtitle) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            {heading && (
              <p className={`text-sm font-semibold uppercase tracking-widest ${sColor}`}>
                {heading}
              </p>
            )}
            {subtitle && (
              <h2 className={`mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl ${hColor}`}>
                {subtitle}
              </h2>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {industries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {industriesHeading && (
                <h3 className={`mb-6 text-lg font-bold ${hColor}`}>{industriesHeading}</h3>
              )}
              <PieChart industries={industries} labelColor={lColor} />
            </motion.div>
          )}

          {regions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {regionsHeading && (
                <h3 className={`mb-6 text-lg font-bold ${hColor}`}>{regionsHeading}</h3>
              )}
              <BarChart regions={regions} labelColor={lColor} />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}