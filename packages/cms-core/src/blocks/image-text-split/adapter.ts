import type { ImageTextSplitBlockProps } from './types'
import { extractRichText } from '../../lib/extract-rich-text'

export function adaptImageTextSplitBlock(raw: unknown): ImageTextSplitBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const image = data['image'] as Record<string, unknown> | null | undefined
  const imageUrl = image && typeof image['url'] === 'string' ? image['url'] : ''

  const primaryBtn = (data['primaryButton'] ?? {}) as Record<string, unknown>
  const primaryLabel = typeof primaryBtn['label'] === 'string' && primaryBtn['label'] ? primaryBtn['label'] : undefined
  const primaryHref = typeof primaryBtn['href'] === 'string' && primaryBtn['href'] ? primaryBtn['href'] : undefined

  const rawSplit = data['imageSplit']
  const imageSplit: ImageTextSplitBlockProps['imageSplit'] =
    rawSplit === '40/60' || rawSplit === '50/50' || rawSplit === '60/40' ? rawSplit : '50/50'

  const rawBg = data['backgroundStyle']
  const backgroundStyle: ImageTextSplitBlockProps['backgroundStyle'] =
    rawBg === 'white' || rawBg === 'light' || rawBg === 'dark' ? rawBg : 'white'

  const rawPos = data['imagePosition']
  const imagePosition: ImageTextSplitBlockProps['imagePosition'] =
    rawPos === 'left' || rawPos === 'right' ? rawPos : 'left'

  const rawVAlign = data['verticalAlign']
  const verticalAlign: ImageTextSplitBlockProps['verticalAlign'] =
    rawVAlign === 'top' || rawVAlign === 'center' ? rawVAlign : 'center'

  return {
    imageUrl,
    imageAlt: typeof data['imageAlt'] === 'string' ? data['imageAlt'] : '',
    imagePosition,
    heading: typeof data['heading'] === 'string' ? data['heading'] : '',
    body: extractRichText(data['body']),
    imageSplit,
    backgroundStyle,
    verticalAlign,
    ...(typeof data['eyebrow'] === 'string' && data['eyebrow'] ? { eyebrow: data['eyebrow'] } : {}),
    ...(primaryLabel ? { primaryButtonLabel: primaryLabel } : {}),
    ...(primaryHref ? { primaryButtonHref: primaryHref } : {}),
  }
}
