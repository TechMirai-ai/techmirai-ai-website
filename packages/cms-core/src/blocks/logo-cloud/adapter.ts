import type { LogoCloudBlockProps, LogoItem, ScrollSpeed } from './types'

export function adaptLogoCloudBlock(raw: unknown): LogoCloudBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawLogos = Array.isArray(data['logos']) ? data['logos'] : []
  const logos: LogoItem[] = rawLogos
    .filter((l): l is Record<string, unknown> => typeof l === 'object' && l !== null)
    .map((l) => {
      const media = l['logo'] as Record<string, unknown> | null | undefined
      const logoUrl = media && typeof media['url'] === 'string' ? media['url'] : ''
      const name = typeof l['name'] === 'string' ? l['name'] : ''
      const captionStr = typeof l['caption'] === 'string' && l['caption'] ? l['caption'] : ''
      return {
        logoUrl,
        name,
        ...(captionStr ? { caption: captionStr } : {}),
      }
    })
    .filter((l) => l.logoUrl && l.name)

  const raw_speed = data['scrollSpeed']
  const scrollSpeed: ScrollSpeed =
    raw_speed === 'slow' || raw_speed === 'fast' ? raw_speed : 'medium'

  const eyebrow = typeof data['eyebrow'] === 'string' ? data['eyebrow'] : ''
  const headingStr = typeof data['heading'] === 'string' && data['heading'] ? data['heading'] : ''

  return {
    eyebrow,
    logos,
    scrollSpeed,
    ...(headingStr ? { heading: headingStr } : {}),
  }
}
