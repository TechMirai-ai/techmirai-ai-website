import type { PlacementStatisticsBlockProps, IndustrySlice, RegionBar } from './types'

export function adaptPlacementStatisticsBlock(raw: unknown): PlacementStatisticsBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawBg = data['backgroundStyle']
  const backgroundStyle: PlacementStatisticsBlockProps['backgroundStyle'] =
    rawBg === 'light' || rawBg === 'dark' || rawBg === 'brand' ? rawBg : 'dark'

  const rawIndustries = Array.isArray(data['industries']) ? data['industries'] : []
  const industries: IndustrySlice[] = rawIndustries
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      name: typeof item['name'] === 'string' ? item['name'] : '',
      percentage: typeof item['percentage'] === 'number' ? item['percentage'] : 0,
    }))
    .filter((item) => item.name)

  const rawRegions = Array.isArray(data['regions']) ? data['regions'] : []
  const regions: RegionBar[] = rawRegions
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      name: typeof item['name'] === 'string' ? item['name'] : '',
      value: typeof item['value'] === 'number' ? item['value'] : 0,
    }))
    .filter((item) => item.name)

  return {
    backgroundStyle,
    industries,
    regions,
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['subtitle'] === 'string' && data['subtitle'] ? { subtitle: data['subtitle'] } : {}),
    ...(typeof data['industriesHeading'] === 'string' && data['industriesHeading']
      ? { industriesHeading: data['industriesHeading'] }
      : {}),
    ...(typeof data['regionsHeading'] === 'string' && data['regionsHeading']
      ? { regionsHeading: data['regionsHeading'] }
      : {}),
  }
}
