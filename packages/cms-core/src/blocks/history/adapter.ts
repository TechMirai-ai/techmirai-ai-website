import type { HistoryBlockProps, HistoryEntry } from './types'
import { extractRichText } from '../../lib/extract-rich-text'

export function adaptHistoryBlock(raw: unknown): HistoryBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawEntries = Array.isArray(data['entries']) ? data['entries'] : []
  const entries: HistoryEntry[] = rawEntries
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => {
      const image = e['image'] as Record<string, unknown> | null | undefined
      const imageUrl = image && typeof image['url'] === 'string' ? image['url'] : undefined
      return {
        year: typeof e['year'] === 'string' ? e['year'] : '',
        title: typeof e['title'] === 'string' ? e['title'] : '',
        description: extractRichText(e['description']),
        ...(typeof e['month'] === 'string' && e['month'] ? { month: e['month'] } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(typeof e['imageAlt'] === 'string' && e['imageAlt'] ? { imageAlt: e['imageAlt'] } : {}),
        ...(typeof e['badge'] === 'string' && e['badge'] ? { badge: e['badge'] } : {}),
      }
    })
    .filter((e) => e.year && e.title)

  const rawLayout = data['layout']
  const layout: HistoryBlockProps['layout'] =
    rawLayout === 'alternating' || rawLayout === 'left' || rawLayout === 'right' ? rawLayout : 'alternating'

  const rawAccent = data['accentColor']
  const accentColor: HistoryBlockProps['accentColor'] =
    rawAccent === 'brand' || rawAccent === 'dark' || rawAccent === 'light' ? rawAccent : 'brand'

  return {
    entries,
    layout,
    accentColor,
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['intro'] === 'string' && data['intro'] ? { intro: data['intro'] } : {}),
  }
}
