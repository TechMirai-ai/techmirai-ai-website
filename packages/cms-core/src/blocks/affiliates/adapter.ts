import type { AffiliatesBlockProps, AffiliateItem } from './types'

export function adaptAffiliatesBlock(raw: unknown): AffiliatesBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawItems = Array.isArray(data['items']) ? data['items'] : []
  const items: AffiliateItem[] = rawItems
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const logo = item['logo'] as Record<string, unknown> | null | undefined
      const logoUrl = logo && typeof logo['url'] === 'string' ? logo['url'] : undefined
      return {
        name: typeof item['name'] === 'string' ? item['name'] : '',
        ...(logoUrl ? { logoUrl } : {}),
        ...(typeof item['description'] === 'string' && item['description'] ? { description: item['description'] } : {}),
        ...(typeof item['href'] === 'string' && item['href'] ? { href: item['href'] } : {}),
      }
    })
    .filter((item) => item.name)

  const rawLayout = data['layout']
  const layout: AffiliatesBlockProps['layout'] =
    rawLayout === 'cards' || rawLayout === 'logos' || rawLayout === 'list' ? rawLayout : 'cards'

  const rawColumns = data['columns']
  const columns: AffiliatesBlockProps['columns'] =
    rawColumns === '2' || rawColumns === '3' || rawColumns === '4' ? rawColumns : '3'

  const rawAnimation = data['animation']
  const animation: AffiliatesBlockProps['animation'] =
    rawAnimation === 'marquee' ? 'marquee' : 'none'

  return {
    items,
    layout,
    columns,
    animation,
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['body'] === 'string' && data['body'] ? { body: data['body'] } : {}),
  }
}
