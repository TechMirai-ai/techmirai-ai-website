import type { MetadataRoute } from 'next'
import { getCachedPayload } from '@/lib/payload'
import { buildSitemapEntries } from '@/lib/seo/sitemap-entries'
import { isCaseStudyVisible } from '@/lib/seo/case-study-visibility'

// Pack-4/L1: one sitemap listing both the Japanese (unprefixed) and English
// (/en) URL of every public page, each with ja/en/x-default alternates.
// The page list itself lives in lib/seo/sitemap-entries.ts.

type BlogDoc = { slug?: unknown; updatedAt?: unknown }

async function fetchBlogPosts(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  try {
    const payload = await getCachedPayload()
    const res = await payload.find({
      collection: 'blog',
      limit: 1000,
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
      where: { active: { equals: true } },
    })
    return (res.docs as BlogDoc[])
      .filter((doc) => typeof doc.slug === 'string' && doc.slug)
      .map((doc) => ({
        slug: String(doc.slug),
        ...(typeof doc.updatedAt === 'string' ? { updatedAt: doc.updatedAt } : {}),
      }))
  } catch (error: unknown) {
    console.error('[sitemap] blog posts could not be read; listing static pages only', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, caseStudyVisible] = await Promise.all([fetchBlogPosts(), isCaseStudyVisible()])
  return buildSitemapEntries({ blogPosts, caseStudyVisible, now: new Date() })
}
