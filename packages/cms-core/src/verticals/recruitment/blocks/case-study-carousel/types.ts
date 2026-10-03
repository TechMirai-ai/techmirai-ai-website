export interface MapMarker {
  topPercent: number
  leftPercent: number
}

export interface CaseStudyCarouselBlockProps {
  // Retained interface compatibility parameters
  sectionHeading?: string
  testimonialIds?: string[]
  autoAdvanceSeconds?: number

  // New design parameters matching image_7d417b.png
  missionCard?: {
    title: string
    description: string
    statBadge?: string
  }
  impactCard?: {
    title: string
    description: string
    ctaLabel?: string
    ctaHref?: string
    mapMarkers?: MapMarker[]
  }
}