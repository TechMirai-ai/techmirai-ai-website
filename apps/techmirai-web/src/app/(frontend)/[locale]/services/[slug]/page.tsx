import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getCachedPayload } from '@/lib/payload'
import { staticParamsOrEmpty } from '@/lib/static-params'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import siteConfig from '../../../../../../site.config'

export const revalidate = 3600

function isSupportedLocale(s: string): boolean {
  return (siteConfig.locales.enabled as string[]).includes(s)
}

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

type RawBlock = { blockType: string; id?: string } & Record<string, unknown>

export async function generateStaticParams() {
  return staticParamsOrEmpty('services/[slug]', async () => {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'services',
      where: { active: { equals: true } },
      limit: 100,
    })
    return siteConfig.locales.enabled.flatMap((locale) =>
      result.docs.map((service) => ({
        locale,
        slug: service.slug as string,
      })),
    )
  })
}

export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isSupportedLocale(locale)) return {}

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'services',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })
  const service = result.docs[0]
  if (!service) return {}

  const title = typeof service['title'] === 'string' ? service['title'] : ''
  const description = typeof service['excerpt'] === 'string' ? service['excerpt'] : ''
  const thumbnail = service['thumbnail'] as Record<string, unknown> | null | undefined
  const thumbnailUrl =
    thumbnail && typeof thumbnail['url'] === 'string' ? thumbnail['url'] : undefined

  const base = `https://${siteConfig.site.domain}`
  const defaultLocale = siteConfig.locales.default
  const canonicalPath =
    locale === defaultLocale ? `/services/${slug}` : `/${locale}/services/${slug}`

  const languages: Record<string, string> = {
    'x-default': `${base}/services/${slug}`,
  }
  for (const loc of siteConfig.locales.enabled) {
    languages[loc] =
      loc === defaultLocale ? `${base}/services/${slug}` : `${base}/${loc}/services/${slug}`
  }

  return {
    title,
    ...(description ? { description } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url: `${base}${canonicalPath}`,
      siteName: siteConfig.site.name,
      locale,
      type: 'website',
      ...(thumbnailUrl ? { images: [{ url: thumbnailUrl }] } : {}),
    },
    alternates: {
      canonical: `${base}${canonicalPath}`,
      languages,
    },
    // Not a Spec §4 page (O1): reachable, never indexed.
    robots: { index: false, follow: false },
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  if (!siteConfig.features.services) notFound()

  const { locale, slug } = await params
  if (!slug) notFound()
  if (!isSupportedLocale(locale)) notFound()

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'services',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })

  const service = result.docs[0]
  if (!service) notFound()

  // Extract blocks layout array
  const blocks = (service['layout'] ?? []) as RawBlock[]
  
  // Extract Service fields
  const titleText = typeof service['title'] === 'string' ? service['title'] : ''
  const excerptText = typeof service['excerpt'] === 'string' ? service['excerpt'] : null
  const bodyText = typeof service['body'] === 'string' ? service['body'] : null

  // Resolve Thumbnail Image Object
  const thumbnail = service['thumbnail'] as Record<string, unknown> | null | undefined
  const thumbnailUrl = thumbnail && typeof thumbnail['url'] === 'string' ? thumbnail['url'] : null
  const thumbnailAlt = thumbnail && typeof thumbnail['alt'] === 'string' ? thumbnail['alt'] : titleText

  return (
    <main className="w-full bg-white">
      
      {/* Header Container Area */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 border-b border-neutral-100">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          
          {/* 🛠️ FIXED: Image is now placed first (Left Side on desktop screen layouts) */}
          {thumbnailUrl && (
            <div className="relative flex items-center justify-start shrink-0">
              <div className="relative w-40 h-24 sm:w-48 sm:h-28">
                <Image
                  src={thumbnailUrl}
                  alt={thumbnailAlt}
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </div>
          )}

          {/* Right Side: Title & Excerpt Text Info values */}
          <div className="max-w-3xl flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text,#111827)] sm:text-4xl">
              {titleText}
            </h1>
            {excerptText && (
              <p className="mt-3 text-base leading-relaxed text-[var(--color-muted,#4b5563)] sm:text-lg">
                {excerptText}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Optional rich body section field wrapper */}
      

      {/* Dynamic layout engine page block elements mapping renderer */}
      <div className="w-full">
        {blocks.map((block, index) => {
          const renderer = blockRegistry[block.blockType]
          if (!renderer) return null
          return <div key={block.id ?? index}>{renderer(block)}</div>
        })}
      </div>

    </main>
  )
}