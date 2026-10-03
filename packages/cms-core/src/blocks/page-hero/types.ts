export interface PageHeroBreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeroProfileCardRow {
  label: string
  value: string
}

export interface PageHeroProfileCard {
  badgeText?: string
  cardHeading?: string
  rows?: PageHeroProfileCardRow[]
}

export interface PageHeroBlockProps {
  blockType?: 'page-hero'
  variant?: 'hero' | 'page-title'

  // hero variant fields
  heading?: string
  coloredSubtitle?: string
  body?: string
  backgroundImageUrl?: string
  overlayOpacity?: number
  overlayColor?: 'black' | 'brand' | 'none'
  primaryButton?: { label: string; href: string }
  secondaryButton?: { label?: string; href?: string }
  profileCard?: PageHeroProfileCard

  // page-title variant fields
  pageTitle?: string

  // shared / legacy
  showBreadcrumb?: boolean
  breadcrumbItems?: PageHeroBreadcrumbItem[]
  textAlignment?: 'left' | 'center'
  minHeight?: 'sm' | 'md' | 'lg'
}
