export interface StatsBarItem {
  value?: string
  label: string
  body?: string
  icon?: string
}

export interface StatsBarBlockProps {
  blockType?: 'stats-bar'
  items: StatsBarItem[]
  backgroundStyle?: 'brand' | 'White' | 'light'
  layout?: 'row' | 'grid'
}
