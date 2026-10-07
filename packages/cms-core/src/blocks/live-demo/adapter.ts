import type { LiveDemoBlockProps, LiveDemoChecklistItem, LiveDemoStep, LiveDemoTile } from './types'

function adaptTextItems<T extends { text: string }>(raw: unknown): T[] {
  const list = Array.isArray(raw) ? raw : []
  return list
    .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
    .map((i) => ({ text: typeof i['text'] === 'string' ? i['text'] : '' }) as T)
    .filter((i) => i.text)
}

export function adaptLiveDemoBlock(raw: unknown): LiveDemoBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const checklistItems = adaptTextItems<LiveDemoChecklistItem>(data['checklistItems'])
  const threeStepStrip = adaptTextItems<LiveDemoStep>(data['threeStepStrip'])

  const rawTiles = Array.isArray(data['tiles']) ? data['tiles'] : []
  const tiles: LiveDemoTile[] = rawTiles
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .map((t) => ({
      label: typeof t['label'] === 'string' ? t['label'] : '',
      description: typeof t['description'] === 'string' ? t['description'] : '',
      href: typeof t['href'] === 'string' ? t['href'] : '#',
      ...(typeof t['buttonLabel'] === 'string' && t['buttonLabel'] ? { buttonLabel: t['buttonLabel'] } : {}),
    }))
    .filter((t) => t.label)

  const heading = typeof data['heading'] === 'string' ? data['heading'] : ''
  const body = typeof data['body'] === 'string' && data['body'] ? data['body'] : ''
  const buttonLabel = typeof data['buttonLabel'] === 'string' && data['buttonLabel'] ? data['buttonLabel'] : ''
  const buttonHref = typeof data['buttonHref'] === 'string' && data['buttonHref'] ? data['buttonHref'] : ''
  const qrCaption = typeof data['qrCaption'] === 'string' && data['qrCaption'] ? data['qrCaption'] : ''
  const smallPrint = typeof data['smallPrint'] === 'string' && data['smallPrint'] ? data['smallPrint'] : ''
  // Injected onto the raw block by the homepage route (siteConfig.integrations.demoUrl) —
  // not a CMS field of its own, see types.ts.
  const qrCodeDataUrl = typeof data['qrCodeDataUrl'] === 'string' && data['qrCodeDataUrl'] ? data['qrCodeDataUrl'] : ''

  return {
    heading,
    tiles,
    ...(body ? { body } : {}),
    ...(checklistItems.length > 0 ? { checklistItems } : {}),
    ...(buttonLabel ? { buttonLabel } : {}),
    ...(buttonHref ? { buttonHref } : {}),
    ...(qrCaption ? { qrCaption } : {}),
    ...(smallPrint ? { smallPrint } : {}),
    ...(threeStepStrip.length > 0 ? { threeStepStrip } : {}),
    ...(qrCodeDataUrl ? { qrCodeDataUrl } : {}),
  }
}
