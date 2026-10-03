'use client'
// Client boundary: scroll-triggered stagger animation via Framer Motion whileInView

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { SectionEyebrow } from '../../components/ui'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { BlogTeaserBlockProps, BlogPostTeaser } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

// Category-to-gradient fallback for posts without a thumbnail
const CATEGORY_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
]

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function PostCard({
  post,
  index,
  readMoreLabel,
  minReadSuffix,
}: {
  post: BlogPostTeaser
  index: number
  readMoreLabel: string
  minReadSuffix: string
}) {
  const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length]
  const locale = useLocale()

  return (
    <motion.article
      variants={fadeInUp}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-neutral-200) bg-white transition-shadow duration-200 hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} aria-hidden="true" />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        {/* Meta row */}
        <div className="mb-3 flex items-center gap-3">
          {post.category && (
            <span className="text-xs font-semibold uppercase tracking-wider text-(--color-primary)">
              {post.category}
            </span>
          )}
          {post.readTime && (
            <span className="text-xs text-(--color-muted)">{post.readTime} {minReadSuffix}</span>
          )}
        </div>

        <h3 className="mb-3 line-clamp-2 text-xl font-semibold text-(--color-text)">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="mb-4 flex-1 line-clamp-3 text-sm leading-relaxed text-(--color-muted)">
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-4">
          {post.publishedAt && (
            <span className="text-xs text-(--color-muted)">{formatDate(post.publishedAt)}</span>
          )}
          <Link
            href={withLocale(locale, post.href)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-primary) hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
          >
            {readMoreLabel}
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

export function BlogTeaserBlock({
  eyebrow,
  heading,
  intro,
  posts,
  viewAllCta,
  readMoreLabel = 'Read more',
  minReadSuffix = 'min read',
}: BlogTeaserBlockProps) {
  if (posts.length === 0) return null

  const locale = useLocale()

  return (
    <section aria-labelledby="blog-teaser-heading" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
            {heading && (
              <h2
                id="blog-teaser-heading"
                className="mt-3 text-3xl font-bold text-(--color-text) md:text-4xl"
              >
                {heading}
              </h2>
            )}
            {intro && (
              <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted)">{intro}</p>
            )}
          </div>
          {viewAllCta && (
            <Link
              href={withLocale(locale, viewAllCta.href)}
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-(--color-primary) hover:underline sm:inline-flex"
            >
              {viewAllCta.label}
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} readMoreLabel={readMoreLabel} minReadSuffix={minReadSuffix} />
          ))}
        </motion.div>

        {/* Mobile view-all CTA */}
        {viewAllCta && (
          <div className="mt-10 text-center sm:hidden">
            <Link
              href={withLocale(locale, viewAllCta.href)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-primary) hover:underline"
            >
              {viewAllCta.label}
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
