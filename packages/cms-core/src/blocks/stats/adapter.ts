import type { StatsBlockProps, StatItem } from './types'

export function adaptStatsBlock(raw: unknown): StatsBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawItems = Array.isArray(data['items']) ? data['items'] : []
  const items: StatItem[] = rawItems
    .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
    .map((i) => {
      const value = typeof i['value'] === 'number' ? i['value'] : 0
      const label = typeof i['label'] === 'string' ? i['label'] : ''
      const suffixStr = typeof i['suffix'] === 'string' && i['suffix'] ? i['suffix'] : ''
      const iconStr = typeof i['icon'] === 'string' && i['icon'] ? i['icon'] : ''
      return {
        value,
        label,
        ...(suffixStr ? { suffix: suffixStr } : {}),
        ...(iconStr ? { icon: iconStr } : {}),
      }
    })
    .filter((i) => i.label)

  const eyebrowStr = typeof data['eyebrow'] === 'string' && data['eyebrow'] ? data['eyebrow'] : ''
  const headingStr =
    typeof data['sectionHeading'] === 'string' && data['sectionHeading']
      ? data['sectionHeading']
      : ''

  return {
    items,
    ...(eyebrowStr ? { eyebrow: eyebrowStr } : {}),
    ...(headingStr ? { sectionHeading: headingStr } : {}),
  }
}
