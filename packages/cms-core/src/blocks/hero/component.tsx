'use client'

import { useLocale } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Stethoscope, Activity, ClipboardList, Wallet, MapPin, Phone, Calendar, Circle } from 'lucide-react'
import type {
  HeroBlockProps, NavItem, HoursRow, ReservationButton,
  PhoneButton, LineButton, NoteItem, AddressInfo, FirstVisitCard,
} from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

// href is the icon lookup key: unlike `label`, it isn't `localized: true` in the
// Header global schema, so it's the one field guaranteed identical across
// locales — a label-keyed map breaks the moment the page renders in Japanese.
const navIconMapByHref: Record<string, LucideIcon> = {
  '/introduction': Home,
  '/philosophy': Stethoscope,
  '/treatment-details': Activity,
  '/flow': ClipboardList,
  '/fee': Wallet,
  '/access': MapPin,
  // Other known routes, kept for nav items that may point at them.
  '/company': Home,
  '/services': Activity,
  '/contact': MapPin,
}

// Legacy secondary lookup for any nav item whose href isn't in the map above
// yet; only ever matches in English since labels are localized.
const navIconMapByLabel: Record<string, LucideIcon> = {
  'Clinic Introduction': Home,
  'Philosophy & Approach': Stethoscope,
  'Treatment Philosophy & Approach': Stethoscope,
  'Available Treatments': Activity,
  'Treatment Flow': ClipboardList,
  'Fees & Insurance': Wallet,
  'Treatment Fees & Insurance': Wallet,
  'Access': MapPin,
  'Location & Transportation': MapPin,
}

export function HeroBlock({
  headline,
  subheadline,
  heroSlides,
  backgroundImageUrl,
  heroImageUrl,
  logoUrl,
  navItems,
  reservationButton,
  phoneButton,
  lineButton,
  hoursTable,
  notes,
  address,
  firstVisitCard,
}: HeroBlockProps & { locale?: string }) {
  const [current, setCurrent] = useState(0)
  const locale = useLocale()

  const resolvedBgImage = backgroundImageUrl ?? heroImageUrl

  const defaultSlides = [
    { imageUrl: '/hero-placeholder.jpg', alt: '', title: '', subtitle: '' },
  ]

  const slides = heroSlides?.length
    ? heroSlides
    : resolvedBgImage
      ? [{ imageUrl: resolvedBgImage, alt: '', title: '', subtitle: '' }]
      : defaultSlides

  const total = slides.length

  const resolvedLogoUrl = logoUrl || '/brand/Sakura-clinic-logo.png'

  useEffect(() => {
    if (total <= 1) return
    const id = setInterval(() => setCurrent((i) => (i + 1) % total), 5000)
    return () => clearInterval(id)
  }, [total])

  const crossFadeVariants = {
    enter: { opacity: 0, scale: 1.05 },
    center: {
      opacity: 1,
      scale: 1,
      transition: {
        opacity: { duration: 1.4, ease: [0.25, 1, 0.5, 1] },
        scale: { duration: 1.6, ease: [0.25, 1, 0.5, 1] },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      transition: {
        opacity: { duration: 1.0, ease: 'linear' },
        scale: { duration: 1.4, ease: [0.25, 1, 0.5, 1] },
      },
    },
  }

  const defaultNavItems: NavItem[] = [
    { label: 'Clinic Introduction', href: '/company', icon: Home },
    { label: 'Philosophy & Approach', href: '/company', icon: Stethoscope },
    { label: 'Available Treatments', href: '/services', icon: Activity },
    { label: 'Treatment Flow', href: '/services', icon: ClipboardList },
    { label: 'Access', href: '/contact', icon: MapPin },
  ]

  const resolvedNavItems: NavItem[] = navItems?.length
    ? navItems.map((item) => ({
      ...item,
      icon: item.icon ?? navIconMapByHref[item.href] ?? navIconMapByLabel[item.label] ?? Circle,
    }))
    : defaultNavItems

  const resolvedReservation: ReservationButton = reservationButton ?? { label: 'Online Reservation', href: '#' }
  const resolvedPhone: PhoneButton = phoneButton ?? {
    badgeLabel: 'Call Now', phoneDisplay: '+81-3-5432-1188', phoneHref: 'tel:+81354321188', subLabel: 'Click to call us',
  }
  // Fallback only fires if the header global's lineButton is genuinely unset.
  // URL matches the project's one established LINE placeholder convention
  // (see site.config.ts reception.staffLineUrl) rather than a second, unrelated fake handle.
  const resolvedLine: LineButton = lineButton ?? { label: 'LINE Booking', href: 'https://line.me/R/ti/p/~nahidarahamanrupta', subLabel: 'Easy booking & chat' }
  const resolvedHoursRows: HoursRow[] = hoursTable?.rows?.length
    ? hoursTable.rows
    : [
      { day: 'Mon', morning: true, afternoon: true },
      { day: 'Tue', morning: true, afternoon: true },
      { day: 'Wed', morning: true, afternoon: false },
      { day: 'Thu', morning: true, afternoon: true },
      { day: 'Fri', morning: true, afternoon: true },
      { day: 'Sat', morning: true, afternoon: false },
      { day: 'Sun/Holidays', morning: false, afternoon: false },
    ]
  const resolvedMorningLabel = hoursTable?.morningLabel || '9:00 – 12:30'
  const resolvedAfternoonLabel = hoursTable?.afternoonLabel || '14:30 – 18:00'
  const resolvedNotes: NoteItem[] = notes?.length
    ? notes
    : [{ text: 'Wednesdays & Saturdays: open until 1:00 PM' }, { text: 'Temporary closures may occur.' }]
  const resolvedAddress: AddressInfo = address ?? {
    line: 'Sakura Building 1F, 2-14-8 Umegaoka, Setagaya-ku, Tokyo 154-0022',
    mapHref: '#map',
  }
  const resolvedFirstVisit: FirstVisitCard = firstVisitCard ?? {
    heading: 'For First-Time Visitors',
    description: 'We welcome new patients! Feel free to consult with us for your first visit.',
    linkLabel: 'First-time visitors, click here',
    linkHref: '/first-visit',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[68%_32%] xl:grid-cols-[70%_30%] lg:grid-rows-[auto_1fr] w-full lg:min-h-screen px-0 sm:px-6 lg:px-10 pt-4 lg:pt-0">
      {/* Row 1, left column — logo + headline */}
      <div className="lg:col-start-1 lg:row-start-1 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 pb-0">
        <Image
          src={resolvedLogoUrl}
          alt="Sakura Osteopathic Clinic"
          width={350}
          height={100}
          priority
          className="hidden lg:block sm:-mt-8 xl:-mt-15 shrink-0 lg:w-64 xl:w-86"
        />
        {/* Headline – allow wrapping, remove forced nowrap */}
        <div className="max-w-xl mt-15 sm:mt-12 lg:mt-6">
          <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-3xl xl:text-4xl font-extrabold leading-[1.15] tracking-tight text-brand-primary">
            {headline}
          </h1>
          {subheadline && (
            <p className="-mt-1 sm:-mt-1.5 text-xs sm:text-sm lg:text-base text-text-secondary font-medium">
              {subheadline}
            </p>
          )}
        </div>
      </div>

      {/* Row 1, right column — Call & LINE buttons */}
      <div className="hidden lg:flex lg:col-start-2 lg:row-start-1 p-4 sm:p-6 lg:p-8 lg:pb-0 flex-col items-center">
        {/* Language Switcher */}
        <div className="w-full flex justify-center mb-4 sm:mt-2 lg:mt-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Link
              href={withLocale('ja', '/')}
              className={`transition-colors hover:text-brand-primary ${locale === 'ja' ? 'text-brand-primary font-bold' : ''}`}
            >
              日本語
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href={withLocale('en', '/')}
              className={`transition-colors hover:text-brand-primary ${locale === 'en' ? 'text-brand-primary font-bold' : ''}`}
            >
              English
            </Link>
          </div>
        </div>

        {/* Call & LINE Buttons */}
        <div className="grid grid-cols-2 gap-2 xl:gap-4 w-full">
          {/* Call Button */}
          <a href={resolvedPhone.phoneHref} className="flex flex-col items-center group w-full">
            <div className="relative w-full h-12 xl:h-14 bg-white border border-gray-200 shadow-sm group-hover:border-brand-primary rounded-full px-2 xl:px-4 flex items-center justify-center group-hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
              <span className="absolute -top-3 bg-[#EE7A93] text-white text-[10px] xl:text-xs font-bold px-2 xl:px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap transition-transform duration-200 group-hover:scale-105">
                {resolvedPhone.badgeLabel}
              </span>
              <div className="flex items-center gap-1 xl:gap-2 text-gray-900 group-hover:text-brand-primary font-black text-xs xl:text-base tracking-tight whitespace-nowrap transition-colors duration-200">
                <Phone className="w-3.5 h-3.5 xl:w-5 xl:h-5 fill-current text-gray-900 group-hover:text-brand-primary shrink-0 transition-colors duration-200" />
                <span>{resolvedPhone.phoneDisplay}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 text-[10px] xl:text-xs text-gray-700 group-hover:text-brand-primary mt-1.5 h-4 transition-colors duration-200">
              <Phone className="w-3 h-3 text-gray-700 group-hover:text-brand-primary shrink-0 transition-colors duration-200" />
              <span className="whitespace-nowrap">{resolvedPhone.subLabel}</span>
            </div>
          </a>

          {/* LINE Button */}
          <a href={resolvedLine.href} className="flex flex-col items-center group w-full">
            <div className="w-full h-12 xl:h-14 bg-[#06C755] hover:bg-[#05b34c] text-white shadow-sm rounded-full px-2 xl:px-4 flex items-center justify-center gap-1.5 transition-opacity">
              <svg className="w-4 h-4 xl:w-6 xl:h-6 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63h-1.625v1.25h1.625c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.256c-.348 0-.63-.285-.63-.629V8.108c0-.345.282-.63.63-.63h2.256c.349 0 .63.285.63.63 0 .349-.281.63-.63.63h-1.625v1.125h1.625zm-3.896 3.14c0 .248-.146.467-.37.561-.089.038-.184.057-.278.057-.152 0-.301-.052-.422-.152l-2.732-3.414v2.888c0 .344-.282.629-.63.629-.349 0-.63-.285-.63-.629V8.108c0-.247.146-.467.37-.561.225-.094.484-.04.65.129l2.731 3.414V8.108c0-.345.282-.63.63-.63.349 0 .63.285.63.63v4.895zm-6.173 0c0 .344-.282.629-.63.629-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.348 0 .63.285.63.63v4.895zm-2.487 0c0 .344-.282.629-.63.629H3.923c-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.348 0 .63.285.63.63v4.266h1.89c.348 0 .63.283.63.629zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314z" />
              </svg>
              <span className="font-medium text-xs xl:text-base tracking-wide whitespace-nowrap">{resolvedLine.label}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[10px] xl:text-xs text-gray-700 mt-1.5 h-4">
              <span className="w-3.5 h-3.5 bg-[#06C755] rounded-full flex items-center justify-center text-[8px] text-white font-black shrink-0">L</span>
              <span className="whitespace-nowrap">{resolvedLine.subLabel}</span>
            </div>
          </a>
        </div>
      </div>

      {/* Row 2, left column — image & clinic hours */}
      <div className="lg:col-start-1 lg:row-start-2 px-3 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-0 
  mt-2 sm:mt-0 lg:-mt-4 xl:-mt-8 2xl:-mt-10 
  flex flex-col items-center">

        <div className="relative w-full aspect-[16/9] lg:aspect-[2.1/1] overflow-hidden rounded-2xl shadow-sm">
          <AnimatePresence initial mode="popLayout">
            <motion.div
              key={current}
              variants={crossFadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={slides[current]?.imageUrl || ''}
                alt={slides[current]?.alt || ''}
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Clinic Hours Card */}
        <div className="w-[98%] sm:w-[96%] max-w-5xl mx-auto -mt-10 sm:-mt-14 relative z-10 rounded-2xl bg-white shadow-xl p-2.5 sm:p-4 lg:p-5 border border-gray-100">
          <p className="font-semibold text-sm sm:text-base mb-2 text-text-primary text-center sm:text-left">
            {locale === 'ja' ? '診療時間' : 'Clinic Hours'}
          </p>

          <div className="flex flex-col 2xl:flex-row gap-3 2xl:gap-4 items-stretch">
            {/* Table – forced to fit, no overflow */}
            <div className="flex-1 min-w-0">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-1.5 pr-1 font-medium text-gray-500 text-[10px] sm:text-xs w-[20%]">
                      {locale === 'ja' ? '曜日' : 'Day'}
                    </th>
                    {resolvedHoursRows.map((row) => (
                      <th
                        key={row.day}
                        className="py-1.5 px-0.5 font-medium text-text-primary text-center text-[10px] sm:text-xs"
                        title={row.day}
                      >
                        {row.day.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Morning */}
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 pr-1">
                      <span className="inline-block px-1.5 py-0.5 rounded-full bg-[#FFF3C4] text-[#854D0E] font-bold text-[10px] sm:text-[12px] leading-tight">
                        {resolvedMorningLabel}
                      </span>
                    </td>
                    {resolvedHoursRows.map((row) => (
                      <td key={row.day} className="py-1.5 px-0.5 text-center">
                        {row.morning ? (
                          <span className="text-brand-primary font-bold text-base sm:text-lg leading-none">○</span>
                        ) : (
                          <span className="text-gray-400 font-medium text-base sm:text-lg leading-none">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Afternoon */}
                  <tr>
                    <td className="py-1.5 pr-1">
                      <span className="inline-block px-1.5 py-0.5 rounded-full bg-[#EE7A93] text-white font-bold text-[10px] sm:text-[12px] leading-tight">
                        {resolvedAfternoonLabel}
                      </span>
                    </td>
                    {resolvedHoursRows.map((row) => (
                      <td key={row.day} className="py-1.5 px-0.5 text-center">
                        {row.afternoon ? (
                          <span className="text-brand-primary font-bold text-base sm:text-lg leading-none">○</span>
                        ) : (
                          <span className="text-gray-400 font-medium text-base sm:text-lg leading-none">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div className="w-full 2xl:w-[260px] 2xl:shrink-0 bg-[#FAF0EE] rounded-xl p-3 border border-[#F5E1DD]">
              <p className="font-semibold text-xs sm:text-sm mb-1 text-text-primary">{locale === 'ja' ? '備考：' : 'Notes:'}</p>
              <ul className="text-[12px] sm:text-xs text-gray-600 space-y-1 list-disc list-inside">
                {resolvedNotes.map((note, i) => (
                  <li key={i}>{note.text}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Address */}
          <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0" strokeWidth={2} />
              <span className="tracking-wide text-[12px] sm:text-xs md:text-sm">{resolvedAddress.line}</span>
            </div>
            <a
              href={resolvedAddress.mapHref}
              className="px-3 py-0.5 text-xs font-medium border border-brand-primary text-brand-primary rounded-full hover:bg-text-secondary hover:text-white transition-colors whitespace-nowrap"
            >
              {locale === 'ja' ? '地図を見る' : 'view map'}
            </a>
          </div>
        </div>
      </div>

      {/* Right Column / Mobile Action Flow */}
<div className="flex flex-col gap-3 w-full p-3 sm:p-5 lg:p-6 xl:p-8 pt-0 lg:col-start-2 lg:row-start-2">
  
  {/* Nav Grid (Desktop Only) */}
<div className="hidden lg:grid grid-cols-2 gap-2 sm:gap-2.5 xl:gap-3 w-full -mt-6 lg:-mt-10 xl:-mt-14 mb-3">
  {resolvedNavItems.map((item) => {
    const Icon = item.icon
    return (
      <Link
        key={item.label}
        href={withLocale(locale, item.href)}
        className="group bg-white rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-brand-primary/40 transition-all duration-200 h-[95px] xl:h-[105px] border border-gray-100"
      >
        {Icon && (
          <Icon
            className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary shrink-0 transition-transform duration-200 group-hover:scale-110"
            strokeWidth={2}
          />
        )}
        <span className="text-[11px] sm:text-xs xl:text-sm font-extrabold text-brand-primary leading-tight max-w-[120px] whitespace-pre-line">
          {item.label}
        </span>
      </Link>
    )
  })}
</div>

  {/* 1. FOR FIRST-TIME VISITORS CARD (Visible on both Mobile & Desktop) */}
  <div className="bg-[#FAF0EE] border border-[#F5E1DD] rounded-2xl p-4 xl:p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2 mt-2 lg:mt-6 xl:mt-10 w-full">
    <h3 className="font-extrabold text-xs sm:text-sm xl:text-base text-gray-900 tracking-wider uppercase">
      {resolvedFirstVisit.heading}
    </h3>
    <p className="text-[12px] sm:text-xs xl:text-sm text-gray-600 font-medium leading-relaxed max-w-xs">
      {resolvedFirstVisit.description}
    </p>
    <Link
      href={withLocale(locale, resolvedFirstVisit.linkHref)}
      className="mt-1 inline-flex items-center gap-1 text-xs xl:text-sm font-extrabold text-[#EE7A93] hover:underline transition-all"
    >
      <span>{resolvedFirstVisit.linkLabel}</span>
      <span className="text-base leading-none">→</span>
    </Link>
  </div>

  {/* 2. ONLINE RESERVATION BUTTON (Placed after First-Time Visitors card) */}
  <div className="flex justify-center w-full mt-2">
    <Link
      href={resolvedReservation.href}
      className="group bg-brand-primary hover:bg-white border border-brand-primary text-white hover:text-brand-primary active:scale-[0.99] text-xs sm:text-sm xl:text-base text-center flex items-center justify-center gap-2 px-6 sm:px-8 xl:px-10 rounded-full shadow-md transition-all duration-200 h-12 xl:h-14 w-full sm:w-auto max-w-xs leading-tight"
    >
      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6 shrink-0 text-white group-hover:text-brand-primary transition-colors" />
      <span>{resolvedReservation.label}</span>
    </Link>
  </div>

</div>
    </div>
  )
}