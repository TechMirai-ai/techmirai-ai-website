import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import React from 'react'
import { getCachedPayload } from '@/lib/payload'
import { staticParamsOrEmpty } from '@/lib/static-params'
import { blockRegistry } from '@techmirai/cms-core/blocks'
import siteConfig from '../../../../../../site.config'

export const revalidate = 3600

// Not a Spec §4 page (O1): reachable, never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } }

function isSupportedLocale(s: string): boolean {
  return (siteConfig.locales.enabled as string[]).includes(s)
}

function formatArticleDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

type RawBlock = { blockType: string; id?: string } & Record<string, unknown>

export async function generateStaticParams() {
  return staticParamsOrEmpty('news/[slug]', async () => {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'news',
      limit: 1000,
      select: { slug: true },
    })

    const locales = siteConfig.locales.enabled as string[]

    return locales.flatMap((locale) =>
      result.docs
        .filter((doc) => typeof doc.slug === 'string')
        .map((doc) => ({ locale, slug: doc.slug as string }))
    )
  })
}

export const dynamicParams = true

function RenderLexicalText({ content }: { content: any }) {
  if (!content) return null

  if (typeof content === 'string') {
    return <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-5">{content}</p>
  }

  const renderNodes = (nodes: any[]): React.ReactNode => {
    if (!Array.isArray(nodes)) return null
    return nodes.map((node, index) => {
      if (!node) return null

      if (node.type === 'text') {
        let textElement: React.ReactNode = node.text || ''
        if (node.format & 1) textElement = <strong key={index} className="font-bold">{textElement}</strong>
        if (node.format & 2) textElement = <em key={index} className="italic">{textElement}</em>
        return <span key={index}>{textElement}</span>
      }

      switch (node.type) {
        case 'paragraph':
          return (
            <p key={index} className="text-base text-slate-700 leading-relaxed mb-5">
              {node.children ? renderNodes(node.children) : ''}
            </p>
          )
        case 'heading':
          const Tag = node.tag || 'h2'
          const headingStyles: Record<string, string> = {
            h1: 'text-2xl md:text-3xl font-bold mt-8 mb-4',
            h2: 'text-xl md:text-2xl font-bold mt-6 mb-3',
            h3: 'text-lg md:text-xl font-semibold mt-5 mb-2',
          }
          return (
            <Tag key={index} className={headingStyles[Tag] || headingStyles.h2}>
              {node.children ? renderNodes(node.children) : ''}
            </Tag>
          )
        default:
          if (node.children && Array.isArray(node.children)) {
            return <React.Fragment key={index}>{renderNodes(node.children)}</React.Fragment>
          }
          return null
      }
    })
  }

  const targetNodes = content?.root?.children || content?.children || (Array.isArray(content) ? content : null)
  return <div className="prose prose-slate max-w-none">{targetNodes ? renderNodes(targetNodes) : null}</div>
}

export default async function NewsDetailPage({ params }: Props) {
  const { locale, slug } = await params
  if (!slug || !isSupportedLocale(locale)) notFound()

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'news',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  })

  const article = result.docs[0]
  if (!article) notFound()

  const layoutBlocks = (article['layout'] ?? []) as RawBlock[]
  const hasLayoutBlocks = Array.isArray(layoutBlocks) && layoutBlocks.length > 0
  const richTextContent = article['content']

  const titleText = typeof article['title'] === 'string' ? article['title'] : ''
  const excerptText = typeof article['excerpt'] === 'string' ? article['excerpt'] : ''
  const publishedAtStr = typeof article['publishedAt'] === 'string' ? article['publishedAt'] : null

  const thumbnail = article['thumbnail'] as any
  const thumbnailUrl = thumbnail?.url || null
  const thumbnailAlt = thumbnail?.alt || titleText
  // Add this block:
  const additionalImages = Array.isArray(article['additionalImages'])
    ? article['additionalImages']
    : []

  const eventDate = typeof article['eventDate'] === 'string' ? article['eventDate'] : ''
  const eventTime = typeof article['eventTime'] === 'string' ? article['eventTime'] : ''
  const eventType = typeof article['eventType'] === 'string' ? article['eventType'] : 'Online Event'

  return (
    <main className="w-full pt-5 md:pt-6 bg-white min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-100/40 blur-[120px]" />
        <div className="absolute bottom-[15%] left-[45%] w-[35vw] h-[35vw] rounded-full bg-amber-100/30 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-rose-100/40 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-md shadow-sm border border-neutral-100 rounded-2xl overflow-hidden p-10 sm:p-30 md:p-30">
          <div className="border-b pb-8 mb-8">
            {eventDate && (
              <div className="inline-block bg-black text-white text-sm font-medium px-5 py-1.5 mb-6 rounded">
                [{eventDate}{eventTime ? `, ${eventTime}` : ''}, {eventType}]
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-slate-900 mb-4">
              {titleText}
            </h1>

            {excerptText && (
              <div className="text-xl md:text-2xl text-slate-600 italic">
                ~{excerptText}~
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="inline-block bg-black text-white text-xs font-bold px-4 py-1 tracking-wider">News Release</span>
              {publishedAtStr && (
                <time dateTime={publishedAtStr} className="text-sm text-slate-500">
                  {formatArticleDate(publishedAtStr)}
                </time>
              )}
            </div>
          </div>

          <div className="mb-10">
            {hasLayoutBlocks ? (
              layoutBlocks.map((block, index) => {
                const renderer = blockRegistry[block.blockType]
                if (!renderer) return null
                return <div key={block.id ?? index}>{renderer(block)}</div>
              })
            ) : richTextContent ? (
              <RenderLexicalText content={richTextContent} />
            ) : (
              <p className="text-center text-slate-400 py-12 italic">No content available.</p>
            )}
          </div>

          {/* Main Featured Image - Reduced from full width to a controlled container */}
          {thumbnailUrl && (
            <div className="flex justify-center mb-8">
              <div className="relative w-full max-w-4xl rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
                <Image
                  src={thumbnailUrl}
                  alt={thumbnailAlt}
                  width={900}
                  height={450}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Additional Images - Increased visual weight with larger gaps */}
          {additionalImages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
              {additionalImages.map((item: any, index: number) => {
                const imgData = item.image;
                if (!imgData || !imgData.url) return null;

                return (
                  <div key={index} className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200 shadow-lg">
                    <Image
                      src={imgData.url}
                      alt={imgData.alt || `Additional image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}