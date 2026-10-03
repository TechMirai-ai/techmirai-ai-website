export interface AffiliateItem {
  logoUrl?: string
  name: string
  description?: string
  href?: string
}

export interface AffiliatesBlockProps {
  blockType?: 'affiliates'
  heading?: string
  body?: string
  items: AffiliateItem[]
  layout?: 'cards' | 'logos' | 'list'
  columns?: '2' | '3' | '4'
  animation?: 'none' | 'marquee'
}
