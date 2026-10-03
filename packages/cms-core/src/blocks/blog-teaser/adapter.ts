import type { BlogTeaserBlockProps, BlogPostTeaser } from './types'

function mapPost(doc: Record<string, unknown>): BlogPostTeaser | null {
  const title = typeof doc['title'] === 'string' ? doc['title'] : ''
  const slug = typeof doc['slug'] === 'string' ? doc['slug'] : ''
  if (!title || !slug) return null

  const str = (v: unknown) => (typeof v === 'string' && v ? v : '')
  const thumbnail = doc['featuredImage'] as Record<string, unknown> | null | undefined
  const thumbnailUrl = thumbnail && typeof thumbnail['url'] === 'string' ? thumbnail['url'] : ''
  const readTime = typeof doc['readTime'] === 'number' ? doc['readTime'] : 0

  return {
    title,
    slug,
    href: `/blog/${slug}`,
    ...(str(doc['excerpt']) ? { excerpt: str(doc['excerpt']) } : {}),
    ...(str(doc['category']) ? { category: str(doc['category']) } : {}),
    ...(readTime ? { readTime } : {}),
    ...(str(doc['publishedAt']) ? { publishedAt: str(doc['publishedAt']) } : {}),
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
  }
}

export function adaptBlogTeaserBlock(raw: unknown): BlogTeaserBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (v: unknown) => (typeof v === 'string' && v ? v : '')

  const rawPosts = Array.isArray(data['selectedPosts'])
    ? data['selectedPosts']
    : []
  const posts = rawPosts
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map(mapPost)
    .filter((p): p is BlogPostTeaser => p !== null)

  const ctaRaw = (data['viewAllCta'] ?? {}) as Record<string, unknown>
  const ctaLabel = str(ctaRaw['label'])
  const ctaHref = str(ctaRaw['href']) || '/blog'

  const readMoreLabel = str(data['readMoreLabel']) || 'Read more'
  const minReadSuffix = str(data['minReadSuffix']) || 'min read'

  return {
    posts,
    readMoreLabel,
    minReadSuffix,
    ...(str(data['eyebrow']) ? { eyebrow: str(data['eyebrow']) } : {}),
    ...(str(data['heading']) ? { heading: str(data['heading']) } : {}),
    ...(str(data['intro']) ? { intro: str(data['intro']) } : {}),
    ...(ctaLabel ? { viewAllCta: { label: ctaLabel, href: ctaHref } } : {}),
  }
}
