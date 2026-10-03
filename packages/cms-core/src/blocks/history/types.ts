export interface HistoryEntry {
  year: string
  month?: string
  title: string
  description: string
  imageUrl?: string
  imageAlt?: string
  badge?: string
}

export interface HistoryBlockProps {
  blockType?: 'history'
  heading?: string
  intro?: string
  entries: HistoryEntry[]
  layout?: 'alternating' | 'left' | 'right'
  accentColor?: 'brand' | 'dark' | 'light'
}
