import { NextResponse, type NextRequest } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getCachedPayload } from '@/lib/payload'
import { lexicalToText } from '@techmirai/cms-core/payload/lib/richtext-to-text'
import { ABOUT_PAGE_SLUGS } from '@/lib/about-slugs'
import siteConfig from '../../../../site.config'

type RawDoc = Record<string, unknown>

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function localizedPath(path: string, locale: string): string {
  return locale === siteConfig.locales.default ? path : `/${locale}${path}`
}

// The generic "pages" collection also serves the homepage (slug "home") and
// a handful of fixed About sub-pages that live under /about/[slug] instead
// of the top-level catch-all route — see about/[slug]/page.tsx, which shares
// the same ABOUT_PAGE_SLUGS allowlist.
const ABOUT_SLUGS = new Set<string>(ABOUT_PAGE_SLUGS)

function buildPageHref(doc: RawDoc, locale: string): string {
  const slug = str(doc['slug'])
  if (slug === 'home') {
    return locale === siteConfig.locales.default ? '/' : `/${locale}`
  }
  const path = ABOUT_SLUGS.has(slug) ? `/about/${slug}` : `/${slug}`
  return localizedPath(path, locale)
}

// ---------------------------------------------------------------------------
// INDEXED_COLLECTIONS — the single place that controls what search-index
// includes. Set `enabled: false` to pull a collection out of search without
// touching the fetch/serialize logic below. Collections without a real
// frontend detail route (faqs, gallery, downloads — embedded-in-page content
// only) are intentionally left out; see INTEGRATION_NOTES.md.
// ---------------------------------------------------------------------------

// The exact set of Payload collection slugs this route knows how to index —
// keeping this as a literal union (rather than plain `string`) means a typo
// in INDEXED_COLLECTIONS below is a compile error, not a silently-empty
// search source at runtime.
type IndexedCollectionSlug =
  | 'pages'
  | 'services'
  | 'news'
  | 'blog'
  | 'case-studies'
  | 'seminars'
  | 'jobs'
  | 'team'

interface IndexedCollectionConfig {
  collection: IndexedCollectionSlug
  source: string
  enabled: boolean
  where?: Record<string, unknown>
  isFeatureEnabled?: (config: typeof siteConfig) => boolean
  buildHref: (doc: RawDoc, locale: string) => string
  getTitle: (doc: RawDoc) => string
  getExcerpt?: (doc: RawDoc) => string | undefined
}

const INDEXED_COLLECTIONS: IndexedCollectionConfig[] = [
  {
    collection: 'pages',
    source: 'pages',
    enabled: true,
    buildHref: buildPageHref,
    getTitle: (doc) => str(doc['title']),
    getExcerpt: (doc) => str((doc['meta'] as RawDoc | undefined)?.['description']),
  },
  {
    collection: 'services',
    source: 'services',
    enabled: true,
    where: { active: { equals: true } },
    buildHref: (doc, locale) => localizedPath(`/services/${str(doc['slug'])}`, locale),
    getTitle: (doc) => str(doc['title']),
    getExcerpt: (doc) => str(doc['excerpt']),
  },
  {
    collection: 'news',
    source: 'news',
    enabled: true,
    buildHref: (doc, locale) => localizedPath(`/news/${str(doc['slug'])}`, locale),
    getTitle: (doc) => str(doc['title']),
    getExcerpt: (doc) => str(doc['excerpt']),
  },
  {
    collection: 'blog',
    source: 'blog',
    enabled: true,
    isFeatureEnabled: (config) => config.features.blog,
    where: { active: { equals: true } },
    buildHref: (doc, locale) => localizedPath(`/blog/${str(doc['slug'])}`, locale),
    getTitle: (doc) => str(doc['title']),
    getExcerpt: (doc) => str(doc['excerpt']),
  },
  {
    collection: 'case-studies',
    source: 'case-studies',
    enabled: true,
    isFeatureEnabled: (config) => config.features.caseStudies,
    where: { active: { equals: true } },
    buildHref: (doc, locale) => localizedPath(`/case-studies/${str(doc['slug'])}`, locale),
    getTitle: (doc) => str(doc['title']),
    getExcerpt: (doc) => str(doc['tagline']),
  },
  {
    collection: 'seminars',
    source: 'seminars',
    enabled: true,
    isFeatureEnabled: (config) => config.features.seminars,
    where: { active: { equals: true } },
    buildHref: (doc, locale) => localizedPath(`/seminars/${str(doc['slug'])}`, locale),
    getTitle: (doc) => str(doc['title']),
    getExcerpt: (doc) => str(doc['excerpt']),
  },
  {
    collection: 'jobs',
    source: 'recruit',
    enabled: true,
    isFeatureEnabled: (config) => config.features.jobListings,
    where: { active: { equals: true } },
    // Job detail pages live under /recruit/[slug] — /jobs/[slug] is a dead stub.
    buildHref: (doc, locale) => localizedPath(`/recruit/${str(doc['slug'])}`, locale),
    getTitle: (doc) => str(doc['title']),
    getExcerpt: (doc) => str(doc['excerpt']),
  },
  {
    collection: 'team',
    source: 'team',
    enabled: true,
    isFeatureEnabled: (config) => config.features.team,
    buildHref: (doc, locale) => localizedPath(`/team/${str(doc['slug'])}`, locale),
    getTitle: (doc) => str(doc['name']),
    getExcerpt: (doc) => {
      const jobTitle = str(doc['title'])
      const bio = lexicalToText(doc['bio']).slice(0, 160)
      return [jobTitle, bio].filter(Boolean).join(' — ')
    },
  },
]

// ---------------------------------------------------------------------------
// Fetch + serialize
// ---------------------------------------------------------------------------

interface SearchIndexEntry {
  id: string
  title: string
  href: string
  excerpt?: string
  locale: string
  source: string
}

async function fetchCollectionEntries(
  config: IndexedCollectionConfig,
  locale: string,
): Promise<SearchIndexEntry[]> {
  if (!config.enabled) return []
  if (config.isFeatureEnabled && !config.isFeatureEnabled(siteConfig)) return []

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: config.collection,
    where: config.where,
    locale,
    limit: 500,
  } as Parameters<typeof payload.find>[0])

  return (result.docs as RawDoc[])
    .map((doc) => {
      const title = config.getTitle(doc)
      if (!title) return null
      const excerpt = config.getExcerpt?.(doc)
      const idSuffix = str(doc['slug']) || str(doc['id'])
      return {
        id: `${config.source}:${idSuffix}`,
        title,
        href: config.buildHref(doc, locale),
        ...(excerpt ? { excerpt } : {}),
        locale,
        source: config.source,
      }
    })
    .filter((entry): entry is SearchIndexEntry => entry !== null)
}

async function buildSearchIndex(locale: string): Promise<SearchIndexEntry[]> {
  // Promise.allSettled so one misconfigured/broken collection can't take
  // down the rest of the index — its result is dropped and logged instead.
  const settled = await Promise.allSettled(
    INDEXED_COLLECTIONS.map((config) => fetchCollectionEntries(config, locale)),
  )

  const entries: SearchIndexEntry[] = []
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      entries.push(...result.value)
    } else {
      console.error(`[search-index] Failed to index "${INDEXED_COLLECTIONS[i]?.collection}":`, result.reason)
    }
  })
  return entries
}

const getCachedSearchIndex = unstable_cache(
  async (locale: string) => buildSearchIndex(locale),
  ['search-index'],
  { tags: ['search-index'] },
)

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const requestedLocale = url.searchParams.get('locale') ?? siteConfig.locales.default

  if (!siteConfig.locales.enabled.includes(requestedLocale)) {
    return NextResponse.json({ success: false, error: 'Unsupported locale' }, { status: 400 })
  }

  try {
    const data = await getCachedSearchIndex(requestedLocale)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to build search index' }, { status: 500 })
  }
}
