import type { GalleryGridBlockProps, GalleryCategory, GalleryImageItem } from './types'

export function adaptGalleryGridBlock(raw: unknown): GalleryGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawCategories = Array.isArray(data['categories']) ? data['categories'] : []
  const categories: GalleryCategory[] = rawCategories
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      label: typeof c['label'] === 'string' ? c['label'] : '',
      slug: typeof c['slug'] === 'string' ? c['slug'] : '',
    }))
    .filter((c) => c.label && c.slug)

  const rawItems = Array.isArray(data['items']) ? data['items'] : []
  const items: GalleryImageItem[] = rawItems
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const image = item['image'] as Record<string, unknown> | null | undefined
      const imageUrl = image && typeof image['url'] === 'string' ? image['url'] : ''
      return {
        imageUrl,
        ...(typeof item['caption'] === 'string' && item['caption'] ? { caption: item['caption'] } : {}),
        ...(typeof item['category'] === 'string' && item['category'] ? { category: item['category'] } : {}),
      }
    })
    .filter((item) => item.imageUrl)

  const rawColumns = data['columns']
  const columns: GalleryGridBlockProps['columns'] =
    rawColumns === '2' || rawColumns === '3' || rawColumns === '4' ? rawColumns : '3'

  const rawRatio = data['aspectRatio']
  const aspectRatio: GalleryGridBlockProps['aspectRatio'] =
    rawRatio === 'square' || rawRatio === '4:3' || rawRatio === '3:2' || rawRatio === 'auto'
      ? rawRatio
      : 'square'

  return {
    items,
    columns,
    aspectRatio,
    showFilter: typeof data['showFilter'] === 'boolean' ? data['showFilter'] : false,
    enableLightbox: typeof data['enableLightbox'] === 'boolean' ? data['enableLightbox'] : true,
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['intro'] === 'string' && data['intro'] ? { intro: data['intro'] } : {}),
    ...(categories.length > 0 ? { categories } : {}),
  }
}
