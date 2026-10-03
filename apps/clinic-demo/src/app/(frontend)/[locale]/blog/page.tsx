import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import siteConfig from '../../../../../site.config'
import type { Where } from 'payload'
import { getCachedPayload } from '@/lib/payload'
import { HeroBlock, CTABannerBlock } from '@techmirai/cms-core/blocks'
import type { HeroBlockProps, CTABannerBlockProps } from '@techmirai/cms-core/blocks'
import {

  Container,
  Section,
  Heading,
  Card,
  Text,
} from '@techmirai/cms-core/components/ui'

export const revalidate = 3600

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

type IndexProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string }>
}

type BlogSummary = {
  slug: string
  title: string
  subtitle?: string
  excerpt?: string
  category?: string
  publishedAt: string
  author: { name: string }
}

const getBlogPosts = unstable_cache(
  async (locale: Locale, category: string | undefined) => {
    const payload = await getCachedPayload()
    const where: Where = { active: { equals: true } }
    if (category) where['category'] = { equals: category }
    const result = await payload.find({
      collection: 'blog',
      where,
      sort: '-publishedAt',
      locale,
      limit: 50,
    })
    return result.docs as unknown as BlogSummary[]
  },
  ['blog-posts'],
  { tags: ['blog'] },
)

const getBlogCategories = unstable_cache(
  async (locale: Locale) => {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'blog',
      where: { active: { equals: true } },
      sort: '-publishedAt',
      locale,
      limit: 200,
    })
    const docs = result.docs as unknown as BlogSummary[]
    const seen = new Set<string>()
    const categories: string[] = []
    for (const doc of docs) {
      if (doc.category && !seen.has(doc.category)) {
        seen.add(doc.category)
        categories.push(doc.category)
      }
    }
    return categories
  },
  ['blog-categories'],
  { tags: ['blog'] },
)

export async function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

const titles: Record<Locale, string> = {
  en: 'Blog & Insights',
  ja: 'ブログ・インサイト',
}

const descriptions: Record<Locale, string> = {
  en: `Self-care tips, treatment explainers, and news from ${siteConfig.site.name}.`,
  ja: 'セルフケアのコツや施術の解説、さくら接骨院からのお知らせをお届けします。',
}

const homeLabels: Record<Locale, string> = {
  en: 'Home',
  ja: 'ホーム',
}

const heroSubheadings: Record<Locale, string> = {
  en: `Self-care tips, treatment explainers, and news from ${siteConfig.site.name}.`,
  ja: 'セルフケアのコツや施術の解説、さくら接骨院からのお知らせをお届けします。',
}

const allCategoryLabels: Record<Locale, string> = {
  en: 'All',
  ja: 'すべて',
}

const readMoreLabels: Record<Locale, string> = {
  en: 'Read Article',
  ja: '記事を読む',
}

const byLabels: Record<Locale, string> = {
  en: 'By',
  ja: '著者',
}

const ctaHeadings: Record<Locale, string> = {
  en: "Stay informed on Japan's employment landscape",
  ja: '日本の雇用動向を把握しましょう',
}

const ctaButtons: Record<Locale, string> = {
  en: 'Talk to Our Experts',
  ja: '専門家に相談する',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const base = `https://${siteConfig.site.domain}`
  const defaultLocale = siteConfig.locales.default
  const canonicalPath = locale === defaultLocale ? '/blog' : `/${locale}/blog`

  const languages: Record<string, string> = { 'x-default': `${base}/blog` }
  for (const loc of siteConfig.locales.enabled) {
    languages[loc] = loc === defaultLocale ? `${base}/blog` : `${base}/${loc}/blog`
  }

  return {
    title: titles[locale],
    description: descriptions[locale],
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
      url: `${base}${canonicalPath}`,
      siteName: siteConfig.site.name,
      locale,
      type: 'website',
    },
    alternates: {
      canonical: `${base}${canonicalPath}`,
      languages,
    },
  }
}

export default async function BlogIndexPage({ params, searchParams }: IndexProps) {
  if (!siteConfig.features.blog) notFound()

  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const { category } = await searchParams

  const [posts, categories] = await Promise.all([
    getBlogPosts(locale, category),
    getBlogCategories(locale),
  ])

  const base = `https://${siteConfig.site.domain}`
  const defaultLocale = siteConfig.locales.default
  const homeUrl = locale === defaultLocale ? base : `${base}/${locale}`
  const pageUrl = locale === defaultLocale ? `${base}/blog` : `${base}/${locale}/blog`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabels[locale], item: homeUrl },
      { '@type': 'ListItem', position: 2, name: titles[locale], item: pageUrl },
    ],
  }

  const heroProps: HeroBlockProps = {
    heading: titles[locale],
    subheading: heroSubheadings[locale],
    overlayOpacity: 40,
    variant: 'center',
    minHeight: 'medium',
    transparentHeader: false,
  }

  const ctaProps: CTABannerBlockProps = {
    heading: ctaHeadings[locale],
    primaryButton: { label: ctaButtons[locale], href: '/contact' },
    variant: 'filled',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HeroBlock {...heroProps} />
      <Section>
        <Container>
          {categories.length > 0 && (
            <nav
              aria-label={titles[locale]}
              className="flex flex-wrap gap-2 mb-10"
            >
              <Link
                href="?"
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  !category
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'border-neutral-300 text-[var(--color-text)] hover:border-[var(--color-primary)]'
                }`}
              >
                {allCategoryLabels[locale]}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`?category=${encodeURIComponent(cat)}`}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    category === cat
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'border-neutral-300 text-[var(--color-text)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </nav>
          )}
          {posts.length === 0 ? (
            <Text className="text-center text-[var(--color-muted)] py-16">
              {descriptions[locale]}
            </Text>
          ) : (
            <ul
              role="list"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {posts.map((post) => {
                const href =
                  locale === defaultLocale
                    ? `/blog/${post.slug}`
                    : `/${locale}/blog/${post.slug}`
                const date = new Date(post.publishedAt).toLocaleDateString(
                  locale === 'ja' ? 'ja-JP' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' },
                )
                return (
                  <li key={post.slug}>
                    <Card as="article" hover className="flex flex-col h-full p-6">
                      {post.category && (
                        <Text className="text-xs font-medium text-[var(--color-primary)] uppercase tracking-wide mb-2">
                          {post.category}
                        </Text>
                      )}
                      <Heading level={3} className="text-lg mb-2 leading-snug">
                        {post.title}
                      </Heading>
                      {post.excerpt && (
                        <Text className="text-sm text-[var(--color-muted)] mb-4 flex-1 line-clamp-3">
                          {post.excerpt}
                        </Text>
                      )}
                      <div className="mt-auto pt-4 border-t border-neutral-200 flex items-center justify-between">
                        <Text className="text-xs text-[var(--color-muted)]">
                          {byLabels[locale]} {post.author.name} · {date}
                        </Text>
                        <Link
                          href={href}
                          className="text-sm font-medium text-[var(--color-primary)] hover:underline shrink-0 ml-2"
                        >
                          {readMoreLabels[locale]} →
                        </Link>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </Container>
      </Section>
      <CTABannerBlock {...ctaProps} />
    </>
  )
}
