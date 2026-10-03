export interface GalleryCategory {
  label: string
  slug: string
}

export interface GalleryImageItem {
  imageUrl: string
  caption?: string
  category?: string
}

export interface GalleryGridBlockProps {
  blockType?: 'gallery-grid'
  heading?: string
  intro?: string
  showFilter?: boolean
  filterAllLabel?: string
  categories?: GalleryCategory[]
  items: GalleryImageItem[]
  columns?: '2' | '3' | '4'
  enableLightbox?: boolean
  aspectRatio?: 'square' | '4:3' | '3:2' | 'auto'
}
