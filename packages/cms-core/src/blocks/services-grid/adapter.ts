import type { ServicesGridBlockProps, ServiceItem, ServicesLayout } from './types'

export function adaptServicesGridBlock(raw: unknown): ServicesGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawServices = Array.isArray(data['services']) ? data['services'] : []
  const services: ServiceItem[] = rawServices
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => {
      const title = typeof s['title'] === 'string' ? s['title'] : ''
      const subheadline = typeof s['subheadline'] === 'string' ? s['subheadline'] : ''
      const description = typeof s['description'] === 'string' ? s['description'] : ''

      const media = s['image'] as Record<string, unknown> | null | undefined
      const imageUrl = media && typeof media['url'] === 'string' ? media['url'] : ''
      const imageName =
        media && typeof media['filename'] === 'string' ? media['filename'] : title

      const ctaRaw = (s['cta'] ?? {}) as Record<string, unknown>
      const ctaLabel = typeof ctaRaw['label'] === 'string' ? ctaRaw['label'] : ''
      const ctaHref = typeof ctaRaw['href'] === 'string' ? ctaRaw['href'] : '#'

      return { title, subheadline, description, imageUrl, imageName, cta: { label: ctaLabel, href: ctaHref } }
    })
    .filter((s) => s.title)

  const rawLayout = data['layout']
  const layout: ServicesLayout =
    rawLayout === 'corporate-banner' || rawLayout === 'alternating' ? rawLayout : 'alternating'

  return {
    eyebrow: typeof data['eyebrow'] === 'string' ? data['eyebrow'] : '',
    heading: typeof data['heading'] === 'string' ? data['heading'] : '',
    services,
    layout,
  }
}