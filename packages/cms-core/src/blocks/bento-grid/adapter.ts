import type { BentoGridBlockProps, BentoGridItem, BentoLayout } from './types'

export function adaptBentoGridBlock(raw: unknown): BentoGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawItems = Array.isArray(data['items']) ? data['items'] : []
  const items: BentoGridItem[] = rawItems
    .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
    .map((i, idx) => {
      const title = typeof i['title'] === 'string' ? i['title'] : ''
      const description = typeof i['description'] === 'string' ? i['description'] : ''
      // Auto-generate number prefix if CMS field is empty
      const numberStr =
        typeof i['number'] === 'string' && i['number']
          ? i['number']
          : String(idx + 1).padStart(2, '0')
      const iconStr = typeof i['icon'] === 'string' && i['icon'] ? i['icon'] : ''
      return {
        number: numberStr,
        title,
        description,
        ...(iconStr ? { icon: iconStr } : {}),
      }
    })
    .filter((i) => i.title)

  const rawLayout = data['layout']
  const layout: BentoLayout =
    rawLayout === 'standard' || rawLayout === 'asymmetric' ? rawLayout : 'asymmetric'

  const eyebrow = typeof data['eyebrow'] === 'string' ? data['eyebrow'] : ''
  const heading = typeof data['heading'] === 'string' ? data['heading'] : ''
  const introStr =
    typeof data['intro'] === 'string' && data['intro'] ? data['intro'] : ''

  return {
    eyebrow,
    heading,
    items,
    layout,
    ...(introStr ? { intro: introStr } : {}),
  }
}
