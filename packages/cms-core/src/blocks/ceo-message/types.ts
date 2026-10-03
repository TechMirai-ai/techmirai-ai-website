export interface CEOMessageBlockProps {
  blockType?: 'ceo-message'
  portraitUrl: string
  portraitAlt: string
  name: string
  title: string
  message: string
  signatureUrl?: string
  portraitPosition?: 'left' | 'right'
  backgroundStyle?: 'white' | 'light' | 'black'
}
