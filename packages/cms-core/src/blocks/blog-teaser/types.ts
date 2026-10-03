export interface BlogPostTeaser {
  title: string
  slug: string
  excerpt?: string
  category?: string
  readTime?: number
  publishedAt?: string
  thumbnailUrl?: string
  href: string
}

export interface BlogTeaserBlockProps {
  blockType?: 'blog-teaser'
  eyebrow?: string
  heading?: string
  intro?: string
  posts: BlogPostTeaser[]
  viewAllCta?: { label: string; href: string }
  readMoreLabel?: string
  minReadSuffix?: string
}
