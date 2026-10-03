export interface BusinessLineFeature {
  text: string
}

export interface BusinessLineItem {
  imageUrl?: string
  imageAlt?: string
  icon?: string
  eyebrow?: string
  title: string
  description: string
  features?: BusinessLineFeature[]
  ctaLabel?: string
  ctaHref?: string
  imagePosition?: 'auto' | 'left' | 'right'
}

export interface BusinessLineListBlockProps {
  blockType?: 'business-line-list'
  heading?: string
  intro?: string
  items: BusinessLineItem[]
  displayMode?: 'alternating' | 'cards' | 'list'
}
