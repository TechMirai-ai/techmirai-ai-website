import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
export const revalidate = 3600 // refresh listing every 5 min as fallback

const TITLES: Record<string, string> = { en: 'News', ja: 'お知らせ' }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Not a Spec §4 page (O1): reachable, never indexed.
  return { title: TITLES[locale] ?? TITLES['en'], robots: { index: false, follow: false } }
}

function formatNewsDate(iso: string | undefined, locale: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return iso || '' }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const payload = await getPayload({ config: configPromise })

  // Fetch everything directly saved in your Collection
  const result = await payload.find({
    collection: 'news',
    sort: '-publishedAt',
    limit: 24,
    locale,
  })

  const articles = result.docs

  return (
    <main className="bg-[var(--color-background)] min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-[var(--color-text)] tracking-tight mb-8">
          {TITLES[locale] ?? TITLES['en']}
        </h1>
        
        <div className="flex flex-col border-t border-[var(--color-border-default)]">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="group flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 py-6 border-b border-[var(--color-border-default)] transition-colors hover:bg-[var(--color-surface-subtle)] px-2 rounded-lg"
            >
              <time className="w-32 shrink-0 text-xs font-semibold text-[var(--color-muted)] tabular-nums">
                {formatNewsDate(article.publishedAt, locale)}
              </time>
              <span className="flex-1 text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                {article.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}