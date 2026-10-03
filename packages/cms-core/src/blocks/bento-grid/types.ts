export type BentoLayout = 'standard' | 'asymmetric'

export interface BentoGridItem {
  number: string
  title: string
  description: string
  icon?: string
}

export interface BentoGridBlockProps {
  eyebrow: string
  heading: string
  intro?: string
  items: BentoGridItem[]
  layout?: BentoLayout
}
