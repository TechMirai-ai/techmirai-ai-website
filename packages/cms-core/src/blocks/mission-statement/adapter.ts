import type { MissionStatementBlockProps, MissionPhoto, MissionPhotoSize } from './types'

export function adaptMissionStatementBlock(raw: unknown): MissionStatementBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawPhotos = Array.isArray(data['photos']) ? data['photos'] : []
  const photos: MissionPhoto[] = rawPhotos
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map((p) => {
      const img = p['image'] as Record<string, unknown> | null | undefined
      const rawSize = p['size']
      const size: MissionPhotoSize =
        rawSize === 'small' || rawSize === 'large' ? rawSize : 'medium'
      return {
        imageUrl: img && typeof img['url'] === 'string' ? img['url'] : '',
        alt: typeof p['alt'] === 'string' ? p['alt'] : '',
        size,
      }
    })
    .filter((p) => p.imageUrl)

  return {
    missionHeading: typeof data['missionHeading'] === 'string' ? data['missionHeading'] : '',
    missionBody: typeof data['missionBody'] === 'string' ? data['missionBody'] : '',
    visionHeading: typeof data['visionHeading'] === 'string' ? data['visionHeading'] : '',
    visionBody: typeof data['visionBody'] === 'string' ? data['visionBody'] : '',
    ...(photos.length > 0 ? { photos } : {}),
  }
}