'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
import { fadeInUp } from '../../lib/motion'
import type { HoursLocationBlockProps } from './types'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_LABELS: Record<string, { en: string; ja: string }> = {
  monday: { en: 'Mon', ja: '月' },
  tuesday: { en: 'Tue', ja: '火' },
  wednesday: { en: 'Wed', ja: '水' },
  thursday: { en: 'Thu', ja: '木' },
  friday: { en: 'Fri', ja: '金' },
  saturday: { en: 'Sat', ja: '土' },
  sunday: { en: 'Sun', ja: '日' },
}

type Status = 'open' | 'limited' | 'closed'

interface Segment {
  status: Status
  time?: string
}

function parseDay(raw: string | undefined): [Segment, Segment] {
  if (!raw || /^(休診?|closed)$/i.test(raw.trim())) {
    return [{ status: 'closed' }, { status: 'closed' }]
  }

  const parts = raw.split('/').map((s) => s.trim())
  const toSegment = (part: string | undefined): Segment => {
    if (!part || /^休診?$/i.test(part) || /closed/i.test(part)) return { status: 'closed' }
    if (part.startsWith('△')) return { status: 'limited', time: part.slice(1).trim() }
    return { status: 'open', time: part }
  }

  if (parts.length >= 2) {
    return [toSegment(parts[0]), toSegment(parts[1])]
  }

  const single = toSegment(parts[0])
  return [single, single]
}

export function HoursLocationBlock({
  sectionHeading,
  showMap,
  showHours,
  showAddress,
  showPhone,
  address,
  phone,
  mapEmbedUrl,
  businessHours,
}: HoursLocationBlockProps) {
  const rawLocale = useLocale()
  const locale: 'en' | 'ja' = rawLocale === 'ja' ? 'ja' : 'en'

  const hasAddress = showAddress && Boolean(address)
  const hasPhone = showPhone && Boolean(phone)
  const hasHours = showHours && businessHours && Object.keys(businessHours).length > 0
  const hasMap = showMap && Boolean(mapEmbedUrl)

  if (!hasAddress && !hasPhone && !hasHours && !hasMap) return null

  const orderedDays = hasHours
    ? DAY_ORDER.filter((day) => businessHours![day] !== undefined)
    : []

  const sampleDay = orderedDays.find((d) => businessHours?.[d])
  const [sampleMorning, sampleAfternoon] = sampleDay ? parseDay(businessHours![sampleDay]) : [{}, {}]
  const morningTime = sampleMorning.time || '09:00–12:00'
  const afternoonTime = sampleAfternoon.time || '15:00–19:30'

  return (
    <section className="py-12 md:py-20 bg-brand-surface text-slate-800 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative w-full"
        >
          {/* ========== TOP SCALLOP (fixed) ========== */}
          <div className="absolute left-0 right-0 -top-[28px] sm:-top-[36px] w-full overflow-hidden leading-none pointer-events-none z-0">
            <svg
              className="relative block w-full h-[28px] sm:h-[36px]"
              viewBox="0 0 1200 40"
              preserveAspectRatio="none"
            >
              <path
                d="M0,40 Q25,0 50,40 Q75,0 100,40 Q125,0 150,40 Q175,0 200,40 Q225,0 250,40 Q275,0 300,40 Q325,0 350,40 Q375,0 400,40 Q425,0 450,40 Q475,0 500,40 Q525,0 550,40 Q575,0 600,40 Q625,0 650,40 Q675,0 700,40 Q725,0 750,40 Q775,0 800,40 Q825,0 850,40 Q875,0 900,40 Q925,0 950,40 Q975,0 1000,40 Q1025,0 1050,40 Q1075,0 1100,40 Q1125,0 1150,40 Q1175,0 1200,40 L1200,40 L0,40 Z"
                fill="#FAF0EE"
              />
            </svg>
          </div>

          {/* ========== MAIN CARD ========== */}
          <div className="relative z-10 w-full bg-[#FAF0EE] border-x border-[#eedad5] p-6 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
              
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-7">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                  <Image
                    src="/brand/logo3.png"
                    alt="Clinic Logo"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>

                {hasPhone && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm tracking-wider text-slate-500 uppercase">
                      {locale === 'ja' ? 'ご予約・お問い合わせ' : 'Reservations and Inquiries'}
                    </p>
                    <a
                      href={`tel:${phone}`}
                      className="inline-block text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark hover:opacity-85 transition-opacity tabular-nums"
                    >
                      {phone}
                    </a>
                  </div>
                )}

                {hasHours && (
                  <div className="space-y-2 pt-1">
                    <div className="overflow-x-auto pb-2">
                      <table className="w-full text-left border-collapse min-w-[340px]">
                        <thead>
                          <tr className="border-b border-[#eedad5] text-xs sm:text-sm font-semibold text-slate-700">
                            <th scope="col" className="pb-3 pr-4 font-bold text-slate-800 whitespace-nowrap">
                              {locale === 'ja' ? '診療時間' : 'Clinic Hours'}
                            </th>
                            {orderedDays.map((day) => (
                              <th key={day} scope="col" className="pb-3 text-center px-1 font-semibold text-slate-700">
                                {DAY_LABELS[day]?.[locale] ?? day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eedad5] text-xs sm:text-sm">
                          <tr>
                            <td className="py-3.5 pr-4 font-medium text-slate-700 tabular-nums whitespace-nowrap">
                              {morningTime}
                            </td>
                            {orderedDays.map((day) => {
                              const [morning] = parseDay(businessHours![day])
                              return (
                                <td key={day} className="py-3.5 text-center px-1">
                                  {morning.status === 'open' && (
                                    <span className="inline-block text-brand-primary-dark text-base font-bold">●</span>
                                  )}
                                  {morning.status === 'limited' && (
                                    <span className="inline-block text-brand-primary-dark text-base font-bold">▲</span>
                                  )}
                                  {morning.status === 'closed' && (
                                    <span className="inline-block text-slate-300 text-xs font-normal">休</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                          <tr>
                            <td className="py-3.5 pr-4 font-medium text-slate-700 tabular-nums whitespace-nowrap">
                              {afternoonTime}
                            </td>
                            {orderedDays.map((day) => {
                              const [, afternoon] = parseDay(businessHours![day])
                              return (
                                <td key={day} className="py-3.5 text-center px-1">
                                  {afternoon.status === 'open' && (
                                    <span className="inline-block text-brand-primary-dark text-base font-bold">●</span>
                                  )}
                                  {afternoon.status === 'limited' && (
                                    <span className="inline-block text-brand-primary-dark text-base font-bold">▲</span>
                                  )}
                                  {afternoon.status === 'closed' && (
                                    <span className="inline-block text-slate-300 text-xs font-normal">休</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {hasAddress && (
                  <div className="pt-1 flex items-center gap-2 text-slate-700 text-xs sm:text-sm leading-relaxed">
                    <MapPin className="w-4 h-4 text-brand-primary-dark shrink-0" />
                    <span className="whitespace-pre-line font-medium text-slate-700">{address}</span>
                  </div>
                )}
              </div>

              {/* Right Column - Map */}
              {hasMap && (
                <div className="lg:col-span-6 h-[320px] sm:h-[380px] lg:h-[420px] w-full overflow-hidden rounded-2xl border border-[#eedad5] shadow-xs">
                  <iframe
                    src={mapEmbedUrl}
                    title={sectionHeading ?? 'Location map'}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>

            {/* CTA Button */}
            {mapEmbedUrl && (
              <div className="mt-8 pt-6 border-t border-[#eedad5]/80 flex justify-center">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(address || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-primary hover:bg-white border border-brand-primary text-on-primary hover:text-brand-primary-dark px-6 py-3 text-sm font-semibold shadow-xs transition-all duration-200 hover:shadow-md active:scale-95"
                >
                  <span>{locale === 'ja' ? '場所と駐車場の詳細' : 'Location & Parking Details'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* ========== BOTTOM SCALLOP ========== */}
          <div className="absolute left-0 right-0 -bottom-[28px] sm:-bottom-[36px] w-full overflow-hidden leading-none pointer-events-none z-0">
            <svg
              className="relative block w-full h-[28px] sm:h-[36px]"
              viewBox="0 0 1200 40"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 Q25,40 50,0 Q75,40 100,0 Q125,40 150,0 Q175,40 200,0 Q225,40 250,0 Q275,40 300,0 Q325,40 350,0 Q375,40 400,0 Q425,40 450,0 Q475,40 500,0 Q525,40 550,0 Q575,40 600,0 Q625,40 650,0 Q675,40 700,0 Q725,40 750,0 Q775,40 800,0 Q825,40 850,0 Q875,40 900,0 Q925,40 950,0 Q975,40 1000,0 Q1025,40 1050,0 Q1075,40 1100,0 Q1125,40 1150,0 Q1175,40 1200,0 L1200,0 L0,0 Z"
                fill="#FAF0EE"
              />
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  )
}