import type { LucideIcon } from 'lucide-react'

export interface HeroSlide {
  imageUrl: string
  alt: string
  title?: string
  subtitle?: string
}
export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
}

export interface HoursRow {
  day: string
  morning: boolean
  afternoon: boolean
}
export interface ReservationButton {
  label: string
  href: string
}

export interface PhoneButton {
  badgeLabel: string
  phoneDisplay: string
  phoneHref: string
  subLabel: string
}

export interface LineButton {
  label: string
  href: string
  subLabel: string
}

export interface HoursTable {
  morningLabel: string
  afternoonLabel: string
  rows: HoursRow[]
}

export interface NoteItem {
  text: string
}

export interface AddressInfo {
  line: string
  mapHref: string
}

export interface FirstVisitCard {
  heading: string
  description: string
  linkLabel: string
  linkHref: string
}


export interface HeroBlockProps {
  blockType?: 'hero'
  eyebrow?: string
  headline?: string
  subheadline?: string
  backgroundImageUrl?: string
  heroSlides?: HeroSlide[]
  showScrollIndicator?: boolean
  // Legacy support fallback tokens
  heading?: string
  subheading?: string
  tagline?: string
  overlayOpacity?: number
  variant?: string
  minHeight?: string
  transparentHeader?: boolean
  heroImageUrl?: string
  highlights?: string[]
  floatingBadge?: { text: string; subtext?: string }
  logoUrl?: string
  navItems?: NavItem[]
  reservationButton?: ReservationButton
  phoneButton?: PhoneButton
  lineButton?: LineButton
  hoursTable?: HoursTable
  notes?: NoteItem[]
  address?: AddressInfo
  firstVisitCard?: FirstVisitCard
}