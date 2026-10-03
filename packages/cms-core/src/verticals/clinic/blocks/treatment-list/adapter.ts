import { toIdString } from '../../../../payload/lib/to-id-string'
import type { TreatmentListBlockProps, TreatmentCardItem } from './types'

function parseDelimitedList(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function mapTreatment(doc: Record<string, unknown>, index: number): TreatmentCardItem | null {
  const heading = typeof doc['heading'] === 'string' ? doc['heading'] : ''
  if (!heading) return null

  const id = toIdString(doc['id']) || `treatment-${index}`
  const tagline = typeof doc['tagline'] === 'string' && doc['tagline'] ? doc['tagline'] : undefined
  const description = typeof doc['description'] === 'string' && doc['description'] ? doc['description'] : undefined

  const icon = doc['icon'] as Record<string, unknown> | null | undefined
  const iconUrl = icon && typeof icon['url'] === 'string' ? icon['url'] : undefined

  const concernTags = parseDelimitedList(doc['concernTags'])
  const areas = parseDelimitedList(doc['areas'])
  const anchorId = typeof doc['anchorId'] === 'string' && doc['anchorId'] ? doc['anchorId'] : undefined

  return {
    id,
    heading,
    ...(tagline ? { tagline } : {}),
    ...(description ? { description } : {}),
    ...(iconUrl ? { iconUrl } : {}),
    ...(concernTags.length > 0 ? { concernTags } : {}),
    ...(areas.length > 0 ? { areas } : {}),
    ...(anchorId ? { anchorId } : {}),
  }
}

export function adaptTreatmentListBlock(raw: unknown): TreatmentListBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawTreatments = Array.isArray(data['treatments']) ? data['treatments'] : []
  const treatments = rawTreatments
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .map((t, i) => mapTreatment(t, i))
    .filter((t): t is TreatmentCardItem => t !== null)

  return {
    treatments,
    ...(typeof data['eyebrow'] === 'string' && data['eyebrow'] ? { eyebrow: data['eyebrow'] } : {}),
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['subheadline'] === 'string' && data['subheadline'] ? { subheadline: data['subheadline'] } : {}),
  }
}