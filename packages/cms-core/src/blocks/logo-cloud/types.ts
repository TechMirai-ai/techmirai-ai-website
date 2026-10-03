export type ScrollSpeed = 'slow' | 'medium' | 'fast'

export interface LogoItem {
  logoUrl: string
  name: string
  caption?: string
}

export interface LogoCloudBlockProps {
  eyebrow: string
  heading?: string
  logos: LogoItem[]
  scrollSpeed?: ScrollSpeed
}
