import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/lib/seo/JsonLd'
import siteConfig from '../../../../../../site.config'
import { getCachedPayload } from '@/lib/payload'
import { staticParamsOrEmpty } from '@/lib/static-params'
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
  return staticParamsOrEmpty('blog/[slug]', async () => {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'blog',
      where: { active: { equals: true } },
      limit: 200,
    })
    return siteConfig.locales.enabled.flatMap((locale) =>
      result.docs.map((doc) => ({ locale, slug: doc.slug as string })),
    )
  })
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
    image: thumbnailUrl ?? undefined,
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
      ...(post.updatedAt ? { modifiedTime: post.updatedAt } : {}),
    },
  })
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

  // Pack-4/L2: Spec §17.3 BlogPosting + BreadcrumbList (Spec §4 labels).
  const breadcrumbData = breadcrumbJsonLd(locale, [{ path: '' }, { path: '/blog' }, { path: `/blog/${slug}`, name: post.title }])
  const blogPostingData = blogPostingJsonLd({
    locale,
    slug,
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: post.author?.name,
  })

  const thumbnailUrl = post.featuredImage?.url

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
      <JsonLd data={breadcrumbData} />
      <JsonLd data={blogPostingData} />
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
