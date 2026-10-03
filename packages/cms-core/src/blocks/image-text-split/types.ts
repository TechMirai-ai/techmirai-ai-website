export interface ImageTextSplitBlockProps {
  blockType?: 'image-text-split'
  imageUrl: string
  imageAlt: string
  imagePosition?: 'left' | 'right'
  eyebrow?: string
  heading: string
  body: string
  primaryButtonLabel?: string
  primaryButtonHref?: string
  imageSplit?: '40/60' | '50/50' | '60/40'
  backgroundStyle?: 'white' | 'light' | 'dark'
  verticalAlign?: 'top' | 'center'
  
}
