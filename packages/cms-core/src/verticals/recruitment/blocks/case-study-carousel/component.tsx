'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { CaseStudyCarouselBlockProps } from './types'

export function CaseStudyCarouselBlock({ missionCard, impactCard }: CaseStudyCarouselBlockProps) {
  const mission = missionCard ?? {
    title: 'Our Mission Is Clear',
    description: 'To redefine the lending experience, driving efficiency, accuracy, and sustainability for a brighter financial future..',
    statBadge: '$12,000+',
  }

  const impact = impactCard ?? {
    title: 'Our Impact Knows No Bounds',
    description: 'From bustling metropolises to remote corners of the globe, our solutions transcend geographical barriers.',
    ctaLabel: 'Learn More',
    ctaHref: '#',
    mapMarkers: [
      { topPercent: 44, leftPercent: 71.2 },
      { topPercent: 51, leftPercent: 62.3 },
      { topPercent: 57, leftPercent: 67.6 },
    ],
  }

  return (
    <section className="py-16 bg-white" data-block="case-study-carousel">
      {/* Container max-width increased to max-w-7xl to establish identical alignments to global headers */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT PANEL: Mission Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 bg-brand-dark text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[460px]"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight max-w-[220px]">
                {mission.title}
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed font-light max-w-[260px]">
                {mission.description}
              </p>
            </div>

            {/* Metrics Graph Visualizer */}
            <div className="relative mt-8 w-full flex items-end justify-between h-40 pt-10">
              {mission.statBadge && (
                <div className="absolute top-0 left-[55%] -translate-x-1/2 bg-transparent border border-neutral-400 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full whitespace-nowrap">
                  {mission.statBadge}
                </div>
              )}

              <div className="w-[12%] bg-neutral-500/50 h-[25%]" />
              <div className="w-[12%] bg-neutral-500/50 h-[45%]" />
              <div className="w-[12%] bg-neutral-500/50 h-[70%]" />
              
              <div className="w-[14%] bg-white h-[100%] relative flex justify-center">
                <svg className="absolute -top-7 w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4l-8 8h6v8h4v-8h6z" />
                </svg>
              </div>

              <div className="w-[12%] bg-neutral-500/50 h-[70%]" />
              <div className="w-[12%] bg-neutral-500/50 h-[85%]" />
            </div>
          </motion.div>

          {/* RIGHT PANEL: Impact Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-8 bg-bg-secondary p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden min-h-[480px]"
          >
            <div className="flex flex-col gap-3 max-w-xl z-10">
              <h2 className="text-3xl font-semibold tracking-tight text-text-primary">
                {impact.title}
              </h2>
              <p className="text-base text-neutral-500 leading-relaxed max-w-xl font-normal">
                {impact.description}
              </p>
            </div>

            {/* Dotted World Map Container */}
            <div className="absolute inset-x-0 bottom-6 top-32 pointer-events-none select-none flex items-center justify-center px-4 sm:px-8">
              <div className="relative w-full h-full max-w-3xl">
                <svg
                  className="w-full h-full text-neutral-300"
                  viewBox="0 0 1000 440"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* North America */}
                  <path strokeDasharray="0 14" d="M80,100 h160 M90,115 h180 M110,130 h150 M100,145 h130 M70,160 h140 M120,175 h110 M140,190 h60 M150,205 h40" />
                  <path strokeDasharray="0 14" d="M170,70 h50 M190,85 h40" />
                  
                  {/* South America */}
                  <path strokeDasharray="0 14" d="M210,235 h40 M200,250 h50 M210,265 h60 M220,280 h70 M230,295 h60 M240,310 h50 M245,325 h40 M250,340 h35 M255,355 h25 M260,370 h15 M265,385 h10" />
                  
                  {/* Greenland / Iceland */}
                  <path strokeDasharray="0 14" d="M290,30 h80 M310,45 h50 M330,60 h20 M420,55 h15" />

                  {/* Europe */}
                  <path strokeDasharray="0 14" d="M460,75 h90 M450,90 h110 M440,105 h130 M455,120 h100 M470,135 h90 M460,150 h60" />

                  {/* Africa */}
                  <path strokeDasharray="0 14" d="M440,180 h100 M430,195 h120 M435,210 h130 M450,225 h120 M470,240 h95 M480,255 h85 M490,270 h70 M495,285 h60 M500,300 h50 M505,315 h35 M510,330 h20 M515,345 h10" />

                  {/* Asia / Middle East */}
                  <path strokeDasharray="0 14" d="M570,75 h260 M580,90 h270 M590,105 h280 M575,120 h310 M565,135 h310 M560,150 h290 M580,165 h260 M600,180 h220 M615,195 h210 M630,210 h170 M670,225 h110 M690,240 h70" />
                  
                  {/* Japan / Maritime Clusters */}
                  <path strokeDasharray="0 14" d="M860,140 h20 M855,155 h15 M830,215 h15 M815,245 h30 M790,265 h60 M770,280 h70" />

                  {/* Australia & New Zealand */}
                  <path strokeDasharray="0 14" d="M760,310 h80 M745,325 h110 M740,340 h120 M750,355 h100 M765,370 h60 M880,365 h10 M885,380 h8" />
                </svg>

                {/* Map Pinpoints */}
                {impact.mapMarkers?.map((marker, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 150, damping: 13, delay: 0.15 + idx * 0.1 }}
                    style={{ top: `${marker.topPercent}%`, left: `${marker.leftPercent}%` }}
                    /* TODO: color token — bg-[#f59e0b] shadow-[0_0_16px_rgba(245,158,11,0.65)] — amber map pin with glow, maps to --color-accent but shadow rgba needs manual review */
                    className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-[var(--color-accent)] rounded-full shadow-[0_0_16px_rgba(245,158,11,0.65)] -translate-x-1/2 -translate-y-1/2 z-20"
                  />
                ))}
              </div>
            </div>

            
          </motion.div>

        </div>
      </div>
    </section>
  )
}