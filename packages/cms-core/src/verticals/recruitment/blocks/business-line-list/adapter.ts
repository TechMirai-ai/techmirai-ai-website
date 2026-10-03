import type { BusinessLineListBlockProps, BusinessLineItem, BusinessLineFeature } from './types'
import { extractRichText } from '../../../../lib/extract-rich-text'

function mapItem(raw: Record<string, unknown>): BusinessLineItem | null {
  const title = typeof raw['title'] === 'string' ? raw['title'] : ''
  if (!title) return null

  const image = raw['image'] as Record<string, unknown> | null | undefined
  const imageUrl = image && typeof image['url'] === 'string' ? image['url'] : undefined

  const rawFeatures = Array.isArray(raw['features']) ? raw['features'] : []
  const features: BusinessLineFeature[] = rawFeatures
    .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
    .map((f) => ({ text: typeof f['text'] === 'string' ? f['text'] : '' }))
    .filter((f) => f.text)

  const rawImgPos = raw['imagePosition']
  const imagePosition: BusinessLineItem['imagePosition'] =
    rawImgPos === 'left' || rawImgPos === 'right' || rawImgPos === 'auto' ? rawImgPos : 'auto'

  const ctaLabel = typeof raw['ctaLabel'] === 'string' && raw['ctaLabel'] ? raw['ctaLabel'] : undefined
  const ctaHref = typeof raw['ctaHref'] === 'string' && raw['ctaHref'] ? raw['ctaHref'] : undefined

  return {
    title,
    description: extractRichText(raw['description']),
    imagePosition,
    ...(imageUrl ? { imageUrl } : {}),
    ...(typeof raw['imageAlt'] === 'string' && raw['imageAlt'] ? { imageAlt: raw['imageAlt'] } : {}),
    ...(typeof raw['icon'] === 'string' && raw['icon'] ? { icon: raw['icon'] } : {}),
    ...(typeof raw['eyebrow'] === 'string' && raw['eyebrow'] ? { eyebrow: raw['eyebrow'] } : {}),
    ...(features.length > 0 ? { features } : {}),
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaHref ? { ctaHref } : {}),
  }
}

export function adaptBusinessLineListBlock(raw: unknown): BusinessLineListBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawItems = Array.isArray(data['items']) ? data['items'] : []
  const items: BusinessLineItem[] = rawItems
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => mapItem(item))
    .filter((item): item is BusinessLineItem => item !== null)

  const rawMode = data['displayMode']
  const displayMode: BusinessLineListBlockProps['displayMode'] =
    rawMode === 'alternating' || rawMode === 'cards' || rawMode === 'list' ? rawMode : 'alternating'

  return {
    items,
    displayMode,
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['intro'] === 'string' && data['intro'] ? { intro: data['intro'] } : {}),
  }
}
