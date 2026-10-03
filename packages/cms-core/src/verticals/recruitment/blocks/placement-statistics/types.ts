export interface IndustrySlice {
  name: string
  percentage: number
}

export interface RegionBar {
  name: string
  value: number
}

export interface PlacementStatisticsBlockProps {
  blockType?: 'placement-statistics'
  heading?: string
  subtitle?: string
  backgroundStyle?: 'light' | 'dark' | 'brand'
  industriesHeading?: string
  industries: IndustrySlice[]
  regionsHeading?: string
  regions: RegionBar[]
}
