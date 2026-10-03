import type { StatsBarBlockProps, StatsBarItem } from './types'

export function adaptStatsBarBlock(raw: unknown): StatsBarBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawItems = Array.isArray(data['items']) ? data['items'] : []
  const items: StatsBarItem[] = rawItems
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      ...(typeof item['value'] === 'string' && item['value'] ? { value: item['value'] } : {}),
      label: typeof item['label'] === 'string' ? item['label'] : '',
      ...(typeof item['body'] === 'string' && item['body'] ? { body: item['body'] } : {}),
      ...(typeof item['icon'] === 'string' && item['icon'] ? { icon: item['icon'] } : {}),
    }))
    .filter((item) => item.label)

  const rawBg = data['backgroundStyle']
  const backgroundStyle: StatsBarBlockProps['backgroundStyle'] =
    rawBg === 'brand' || rawBg === 'White' || rawBg === 'light' ? rawBg : 'brand'

  const rawLayout = data['layout']
  const layout: StatsBarBlockProps['layout'] =
    rawLayout === 'row' || rawLayout === 'grid' ? rawLayout : 'row'

  return { items, backgroundStyle, layout }
}
