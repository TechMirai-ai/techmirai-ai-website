import type { HoursLocationBlockProps } from './types'

export function adaptHoursLocationBlock(raw: unknown): HoursLocationBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const businessHours =
    typeof data['businessHours'] === 'object' && data['businessHours'] !== null
      ? (data['businessHours'] as Record<string, string>)
      : undefined

  return {
    showMap: data['showMap'] !== false,
    showHours: data['showHours'] !== false,
    showAddress: data['showAddress'] !== false,
    showPhone: data['showPhone'] !== false,
    ...(typeof data['sectionHeading'] === 'string' && data['sectionHeading'] ? { sectionHeading: data['sectionHeading'] } : {}),
    ...(typeof data['address'] === 'string' && data['address'] ? { address: data['address'] } : {}),
    ...(typeof data['phone'] === 'string' && data['phone'] ? { phone: data['phone'] } : {}),
    ...(typeof data['mapEmbedUrl'] === 'string' && data['mapEmbedUrl'] ? { mapEmbedUrl: data['mapEmbedUrl'] } : {}),
    ...(businessHours ? { businessHours } : {}),
  }
}
