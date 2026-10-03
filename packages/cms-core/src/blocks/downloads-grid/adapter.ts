import type { DownloadsGridBlockProps, DownloadItem } from './types'

function mapCollectionDownload(doc: Record<string, unknown>): DownloadItem | null {
  const title = typeof doc['title'] === 'string' ? doc['title'] : ''
  if (!title) return null

  const file = doc['file'] as Record<string, unknown> | null | undefined
  const href = file && typeof file['url'] === 'string' ? file['url'] : ''
  if (!href) return null

  const description = typeof doc['description'] === 'string' && doc['description']
    ? doc['description'] : undefined
  const categoryLabel = typeof doc['category'] === 'string' && doc['category']
    ? doc['category'] : undefined
  const meta = typeof doc['meta'] === 'string' && doc['meta']
    ? doc['meta'] : undefined

  return {
    title,
    href,
    ...(categoryLabel ? { categoryLabel } : {}),
    ...(description ? { description } : {}),
    ...(meta ? { meta } : {}),
  }
}

function mapInlineDownload(item: Record<string, unknown>): DownloadItem | null {
  const title = typeof item['title'] === 'string' ? item['title'] : ''
  const href = typeof item['href'] === 'string' ? item['href'] : ''
  if (!title || !href) return null

  const str = (v: unknown) => (typeof v === 'string' && v ? v : '')

  return {
    title,
    href,
    ...(str(item['categoryLabel']) ? { categoryLabel: str(item['categoryLabel']) } : {}),
    ...(str(item['description']) ? { description: str(item['description']) } : {}),
    ...(str(item['meta']) ? { meta: str(item['meta']) } : {}),
  }
}

export function adaptDownloadsGridBlock(raw: unknown): DownloadsGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (v: unknown) => (typeof v === 'string' && v ? v : '')

  const source = data['source'] === 'inline' ? 'inline' : 'collection'

  let downloads: DownloadItem[] = []
  if (source === 'collection') {
    const rawItems = Array.isArray(data['selectedDownloads']) ? data['selectedDownloads'] : []
    downloads = rawItems
      .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
      .map(mapCollectionDownload)
      .filter((d): d is DownloadItem => d !== null)
  } else {
    const rawItems = Array.isArray(data['inlineDownloads']) ? data['inlineDownloads'] : []
    downloads = rawItems
      .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
      .map(mapInlineDownload)
      .filter((d): d is DownloadItem => d !== null)
  }

  const ctaRaw = (data['viewAllCta'] ?? {}) as Record<string, unknown>
  const ctaLabel = str(ctaRaw['label'])
  const ctaHref = str(ctaRaw['href']) || '/downloads'

  const downloadLabel = str(data['downloadLabel']) || 'Free Download'

  return {
    downloads,
    downloadLabel,
    ...(str(data['eyebrow']) ? { eyebrow: str(data['eyebrow']) } : {}),
    ...(str(data['heading']) ? { heading: str(data['heading']) } : {}),
    ...(str(data['intro']) ? { intro: str(data['intro']) } : {}),
    ...(ctaLabel ? { viewAllCta: { label: ctaLabel, href: ctaHref } } : {}),
  }
}
