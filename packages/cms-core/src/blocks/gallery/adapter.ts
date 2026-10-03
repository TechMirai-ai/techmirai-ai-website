import type { GalleryBlockProps } from './types'

export function adaptGalleryBlock(_raw: unknown): GalleryBlockProps {
  return { categories: [], columns: '3', lightbox: true }
}
