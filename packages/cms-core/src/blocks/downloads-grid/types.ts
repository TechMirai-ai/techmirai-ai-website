export interface DownloadItem {
  categoryLabel?: string
  title: string
  description?: string
  meta?: string
  href: string
}

export interface DownloadsGridBlockProps {
  blockType?: 'downloads-grid'
  eyebrow?: string
  heading?: string
  intro?: string
  downloads: DownloadItem[]
  viewAllCta?: { label: string; href: string }
  downloadLabel?: string
}
