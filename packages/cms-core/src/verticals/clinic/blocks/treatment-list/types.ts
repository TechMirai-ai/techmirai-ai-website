export interface TreatmentCardItem {
  id: string
  heading: string
  tagline?: string
  description?: string
  iconName?: string
  iconUrl?: string
  concernTags?: string[]
  areas?: string[]
  anchorId?: string
}

export interface TreatmentListBlockProps {
  blockType?: 'treatment-list'
  eyebrow?: string
  heading?: string
  subheadline?: string
  treatments: TreatmentCardItem[]
}