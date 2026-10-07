import type {
  CapabilityCardsBlockProps,
  CapabilityCard,
  CapabilityStatus,
  CapabilitySplitItem,
} from './types'

function adaptSplitItems(raw: unknown): CapabilitySplitItem[] {
  const list = Array.isArray(raw) ? raw : []
  return list
    .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
    .map((i) => ({ text: typeof i['text'] === 'string' ? i['text'] : '' }))
    .filter((i) => i.text)
}

export function adaptCapabilityCardsBlock(raw: unknown): CapabilityCardsBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawCards = Array.isArray(data['cards']) ? data['cards'] : []
  const cards: CapabilityCard[] = rawCards
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => {
      const status: CapabilityStatus = c['status'] === 'in-development' ? 'in-development' : 'available'
      return {
        label: typeof c['label'] === 'string' ? c['label'] : '',
        status,
        description: typeof c['description'] === 'string' ? c['description'] : '',
      }
    })
    .filter((c) => c.label)

  const heading = typeof data['heading'] === 'string' ? data['heading'] : ''
  const intro = typeof data['intro'] === 'string' && data['intro'] ? data['intro'] : ''
  const badgeRow = typeof data['badgeRow'] === 'string' && data['badgeRow'] ? data['badgeRow'] : ''
  const splitHeading = typeof data['splitHeading'] === 'string' && data['splitHeading'] ? data['splitHeading'] : ''
  const splitLeftTitle = typeof data['splitLeftTitle'] === 'string' && data['splitLeftTitle'] ? data['splitLeftTitle'] : ''
  const splitRightTitle = typeof data['splitRightTitle'] === 'string' && data['splitRightTitle'] ? data['splitRightTitle'] : ''
  const splitClosingLine = typeof data['splitClosingLine'] === 'string' && data['splitClosingLine'] ? data['splitClosingLine'] : ''
  const splitLeftItems = adaptSplitItems(data['splitLeftItems'])
  const splitRightItems = adaptSplitItems(data['splitRightItems'])

  return {
    heading,
    cards,
    ...(intro ? { intro } : {}),
    ...(badgeRow ? { badgeRow } : {}),
    ...(splitHeading ? { splitHeading } : {}),
    ...(splitLeftTitle ? { splitLeftTitle } : {}),
    ...(splitLeftItems.length > 0 ? { splitLeftItems } : {}),
    ...(splitRightTitle ? { splitRightTitle } : {}),
    ...(splitRightItems.length > 0 ? { splitRightItems } : {}),
    ...(splitClosingLine ? { splitClosingLine } : {}),
  }
}
