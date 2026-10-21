import type { MetadataRoute } from 'next'
import siteConfig from '../../../site.config'
import { hreflangAlternates, localizedUrl } from './build-metadata'
import { LEGAL_PAGE_META, PAGE_META } from './page-meta'

// Pack-4/L1: the public URL list is the Spec §4 page table (every row with a
// §17.1 entry, plus the three legal pages). /thanks, /booking*, /line/* and
// the leftover clinic-era routes are deliberately absent (docs/FINDINGS.md).

const CASE_STUDY_PATH = '/case-studies/sadiatec'

// Voice-pivot launch pages that have no Spec §17.1 row. /company is NOT listed
// yet: seo.test.ts still asserts it is excluded, and CLAUDE.md rule 14 forbids
// rewriting that test without approval (see docs/FINDINGS.md, voice-pivot).
const VOICE_LAUNCH_PATHS: readonly string[] = ['/demo', '/partners']

/** Routes that 404 when their feature flag is off (mirrors each route's own notFound()). */
const FEATURE_GATED: Readonly<Record<string, keyof typeof siteConfig.features>> = {
  '/blog': 'blog',
  '/contact': 'contact',
  '/faq': 'faq',
}

export interface SitemapInput {
  blogPosts: ReadonlyArray<{ slug: string; updatedAt?: string | undefined }>
  caseStudyVisible: boolean
  now: Date
}

function isPublished(path: string, caseStudyVisible: boolean): boolean {
  if (path === CASE_STUDY_PATH) return caseStudyVisible
  const flag = FEATURE_GATED[path]
  return flag === undefined || Boolean(siteConfig.features[flag])
}

function entriesFor(path: string, lastModified: Date): MetadataRoute.Sitemap {
  const languages = hreflangAlternates(path)
  return siteConfig.locales.enabled.map((locale) => ({
    url: localizedUrl(path, locale),
    lastModified,
    alternates: { languages },
  }))
}

/** One entry per locale per public page, each carrying the full hreflang set. */
export function buildSitemapEntries({ blogPosts, caseStudyVisible, now }: SitemapInput): MetadataRoute.Sitemap {
  const staticPaths = [
    ...new Set([...Object.keys(PAGE_META), ...Object.keys(LEGAL_PAGE_META), ...VOICE_LAUNCH_PATHS]),
  ].filter((path) => isPublished(path, caseStudyVisible))

  const postEntries = siteConfig.features.blog
    ? blogPosts.flatMap(({ slug, updatedAt }) =>
        entriesFor(`/blog/${slug}`, updatedAt ? new Date(updatedAt) : now),
      )
    : []

  return [...staticPaths.flatMap((path) => entriesFor(path, now)), ...postEntries]
}
