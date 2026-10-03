export interface NewsItem {
  date: string
  category?: string
  headline: string
  href: string
  thumbnail?: string 
  excerpt?: string
}

export interface NewsListBlockProps {
  blockType?: 'news-list'
  layout?: 'list' | 'carousel'
  eyebrow?: string
  heading?: string
  intro?: string
  items: NewsItem[]
  viewAllCta?: { 
    label: string
    href: string 
  }
  locale?: string
}