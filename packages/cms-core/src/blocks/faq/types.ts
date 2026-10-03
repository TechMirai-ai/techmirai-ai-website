export interface FAQItem {
  id?: string
  question: string
  answer: string
}

export interface FAQBlockProps {
  sectionHeading?: string
  items?: FAQItem[]
  variant?: 'accordion' | 'grid'
}