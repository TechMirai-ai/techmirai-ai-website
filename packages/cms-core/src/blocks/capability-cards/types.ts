export type CapabilityStatus = 'available' | 'in-development'

export interface CapabilityCard {
  label: string
  status: CapabilityStatus
  description: string
}

export interface CapabilitySplitItem {
  text: string
}

export interface CapabilityCardsBlockProps {
  heading: string
  intro?: string
  cards: CapabilityCard[]
  badgeRow?: string
  splitHeading?: string
  splitLeftTitle?: string
  splitLeftItems?: CapabilitySplitItem[]
  splitRightTitle?: string
  splitRightItems?: CapabilitySplitItem[]
  splitClosingLine?: string
}
