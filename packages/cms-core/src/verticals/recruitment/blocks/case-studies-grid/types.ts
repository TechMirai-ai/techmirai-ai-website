export type CaseStudiesLayout = 'stacked' | 'grid' | 'carousel'

export interface CaseStudyCardItem {
  name: string
  role?: string
  tagline?: string
  metric?: { value: string; caption: string }
  challenge?: string
  solution?: string
  photoUrl?: string
  slug?: string
}

export interface CaseStudiesGridBlockProps {
  blockType?: 'case-studies-grid'
  eyebrow?: string
  heading?: string
  subheadline?: string
  button?: { label?: string; href?: string }
  studies: CaseStudyCardItem[]
  layout?: CaseStudiesLayout
  challengeLabel?: string
  solutionLabel?: string
}
