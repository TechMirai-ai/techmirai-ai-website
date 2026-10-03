import type { CaseStudyCarouselBlockProps } from './types'

export function adaptCaseStudyCarouselBlock(raw: any): CaseStudyCarouselBlockProps {
  // Initialize the base object with always-present structural values
  const result: CaseStudyCarouselBlockProps = {
    testimonialIds: [],
    autoAdvanceSeconds: raw?.autoAdvanceSeconds ?? 5,
  }

  // Only assign properties if they are explicitly present to respect exactOptionalPropertyTypes
  if (raw?.sectionHeading) {
    result.sectionHeading = raw.sectionHeading
  }

  if (raw?.missionCard) {
    result.missionCard = {
      title: raw.missionCard.title || 'Our Mission Is Clear',
      description: raw.missionCard.description || '',
      statBadge: raw.missionCard.statBadge || undefined,
    }
  }

  if (raw?.impactCard) {
    result.impactCard = {
      title: raw.impactCard.title || 'Our Impact Knows No Bounds',
      description: raw.impactCard.description || '',
      ctaLabel: raw.impactCard.ctaLabel || undefined,
      ctaHref: raw.impactCard.ctaHref || undefined,
      mapMarkers: raw.impactCard.mapMarkers || [],
    }
  }

  return result
}
