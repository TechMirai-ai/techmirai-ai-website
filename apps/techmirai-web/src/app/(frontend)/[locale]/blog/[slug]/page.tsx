import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import siteConfig from '../../../../../../site.config'
import { getCachedPayload } from '@/lib/payload'
import {
  HeroBlock,
  RichTextBlock,
  CTABannerBlock,
} from '@techmirai/cms-core/blocks'
import type {
  HeroBlockProps,
  RichTextBlockProps,
  CTABannerBlockProps,
} from '@techmirai/cms-core/blocks'
import { Container, Section, Text } from '@techmirai/cms-core/components/ui'

export const revalidate = 3600

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

type Props = { params: Promise<{ locale: string; slug: string }> }

type BlogDoc = {
  title: string
  subtitle?: string
  excerpt?: string
  content: unknown
  featuredImage?: { url?: string | null } | null
  category?: string
  author: { name: string; jobTitle?: string }
  publishedAt: string
  updatedAt?: string
  slug: string
}

const getBlogPost = unstable_cache(
  async (slug: string, locale: Locale) => {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'blog',
      where: { slug: { equals: slug } },
      locale,
      limit: 1,
    })
    return (result.docs[0] ?? null) as BlogDoc | null
  },
  ['blog-post'],
  { tags: ['blog'] },
)

export async function generateStaticParams() {
  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'blog',
    where: { active: { equals: true } },
    limit: 200,
  })
  return siteConfig.locales.enabled.flatMap((locale) =>
    result.docs.map((doc) => ({ locale, slug: doc.slug as string })),
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const post = await getBlogPost(slug, locale)
  if (!post) return {}

  const description = post.excerpt ?? post.subtitle ?? undefined
  const thumbnailUrl = post.featuredImage?.url

  return buildPageMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.title,
    description,
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
      ...(post.updatedAt ? { modifiedTime: post.updatedAt } : {}),
      ...(thumbnailUrl ? { images: [{ url: thumbnailUrl }] } : {}),
    },
  })
}

const homeLabels: Record<Locale, string> = {
  en: 'Home',
  ja: 'ホーム',
}

const blogTitles: Record<Locale, string> = {
  en: 'Blog & Insights',
  ja: 'ブログ・インサイト',
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

const contactLabels: Record<Locale, string> = {
  en: 'Contact Us',
  ja: 'お問い合わせ',
}

export default async function BlogDetailPage({ params }: Props) {
  if (!siteConfig.features.blog) notFound()

  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const post = await getBlogPost(slug, locale)
  if (!post) notFound()

  const base = `https://${siteConfig.site.domain}`
  const defaultLocale = siteConfig.locales.default
  const homeUrl = locale === defaultLocale ? base : `${base}/${locale}`
  const listUrl = locale === defaultLocale ? `${base}/blog` : `${base}/${locale}/blog`
  const pageUrl =
    locale === defaultLocale ? `${base}/blog/${slug}` : `${base}/${locale}/blog/${slug}`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabels[locale], item: homeUrl },
      { '@type': 'ListItem', position: 2, name: blogTitles[locale], item: listUrl },
      { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
    ],
  }

  const thumbnailUrl = post.featuredImage?.url
  const description = post.excerpt ?? post.subtitle

  const blogPostingJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    url: pageUrl,
    author: {
      '@type': 'Person',
      name: post.author.name,
      ...(post.author.jobTitle ? { jobTitle: post.author.jobTitle } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.site.name,
      url: base,
    },
    ...(description ? { description } : {}),
    ...(thumbnailUrl ? { image: thumbnailUrl } : {}),
  }

  const postSubtitle = post.subtitle
  const heroProps: HeroBlockProps = {
    heading: post.title,
    ...(postSubtitle ? { subheading: postSubtitle } : {}),
    ...(thumbnailUrl ? { backgroundImageUrl: thumbnailUrl } : {}),
    overlayOpacity: 50,
    variant: 'center',
    minHeight: 'medium',
    transparentHeader: false,
  }

  const richTextProps: RichTextBlockProps = {
    content: post.content,
    maxWidth: 'prose',
  }

  const ctaProps: CTABannerBlockProps = {
    heading: ctaHeadings[locale],
    primaryButton: { label: ctaButtons[locale], href: '/contact' },
    variant: 'filled',
  }

  const date = new Date(post.publishedAt).toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )

  const jobTitle = post.author.jobTitle

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <HeroBlock {...heroProps} />
      <Section padding="sm">
        <Container>
          <Text className="text-sm text-[var(--color-muted)] text-center">
            {byLabels[locale]} <strong>{post.author.name}</strong>
            {jobTitle && ` · ${jobTitle}`}
            {post.category && ` · ${post.category}`}
            {` · ${date}`}
          </Text>
        </Container>
      </Section>
      <Section>
        <Container>
          <RichTextBlock {...richTextProps} />
        </Container>
      </Section>
      <CTABannerBlock {...ctaProps} />
    </>
  )
}
