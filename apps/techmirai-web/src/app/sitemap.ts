import type { MetadataRoute } from 'next'
import siteConfig from '../../site.config'
import { getCachedPayload } from '@/lib/payload'

const base = `https://${siteConfig.site.domain}`
const defaultLocale = siteConfig.locales.default
const locales = siteConfig.locales.enabled

const featureGate: Partial<Record<string, keyof typeof siteConfig.features>> = {
  blog:           'blog',
  'case-studies': 'caseStudies',
  services:       'services',
  seminars:       'seminars',
  company:        'company',
  recruit:        'recruit',
  faq:            'faq',
  contact:        'contact',
  jobs:           'jobListings',
  events:         'events',
  gallery:        'gallery',
  team:           'team',
  downloads:      'downloads',
  news:           'news',
}

function isEnabled(collection: string): boolean {
  const flag = featureGate[collection]
  return flag === undefined ? true : Boolean(siteConfig.features[flag])
}

function pageUrl(path: string, locale: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  return `${base}${prefix}${path}`
}

function langAlternates(path: string): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, pageUrl(path, l)]))
}

type SlugDoc = { slug?: unknown; updatedAt?: unknown }

async function fetchSlugs(collection: string): Promise<SlugDoc[]> {
  try {
    const payload = await getCachedPayload()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection,
      limit: 1000,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { active: { equals: true } },
    })
    return (res.docs ?? []) as SlugDoc[]
  } catch {
    return []
  }
}

const slugCollections: Array<{
  slug: string
  pathPrefix: string
  feature: keyof typeof siteConfig.features
}> = [
  { slug: 'blog',         pathPrefix: '/blog',         feature: 'blog' },
  { slug: 'case-studies', pathPrefix: '/case-studies', feature: 'caseStudies' },
  { slug: 'news',         pathPrefix: '/news',         feature: 'news' },
  { slug: 'services',     pathPrefix: '/services',     feature: 'services' },
  { slug: 'seminars',     pathPrefix: '/seminars',     feature: 'seminars' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Homepage (one canonical entry with hreflang alternates)
  entries.push({
    url: pageUrl('', defaultLocale) || base,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
    alternates: { languages: langAlternates('') },
  })

  // Collection index pages
  const enabledCollections = siteConfig.seo.sitemapIncludeCollections.filter(isEnabled)
  for (const collection of enabledCollections) {
    const path = `/${collection}`
    entries.push({
      url: pageUrl(path, defaultLocale),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: langAlternates(path) },
    })
  }

  // Dynamic document pages (blog posts, case studies, news, services, seminars)
  const docResults = await Promise.all(
    slugCollections
      .filter(({ feature }) => siteConfig.features[feature])
      .map(({ slug, pathPrefix }) =>
        fetchSlugs(slug).then((docs) => ({ pathPrefix, docs }))
      ),
  )

  for (const { pathPrefix, docs } of docResults) {
    for (const doc of docs) {
      if (!doc.slug) continue
      const path = `${pathPrefix}/${String(doc.slug)}`
      const lastMod = doc.updatedAt ? new Date(String(doc.updatedAt)) : new Date()
      entries.push({
        url: pageUrl(path, defaultLocale),
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages: langAlternates(path) },
      })
    }
  }

  return entries
}
