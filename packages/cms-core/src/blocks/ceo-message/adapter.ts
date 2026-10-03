import type { CEOMessageBlockProps } from './types'
import { extractRichText } from '../../lib/extract-rich-text'

export function adaptCEOMessageBlock(raw: unknown): CEOMessageBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const portrait = data['portrait'] as Record<string, unknown> | null | undefined
  const portraitUrl = portrait && typeof portrait['url'] === 'string' ? portrait['url'] : ''

  const signature = data['signature'] as Record<string, unknown> | null | undefined
  const signatureUrl = signature && typeof signature['url'] === 'string' ? signature['url'] : undefined

  const rawPosition = data['portraitPosition']
  const portraitPosition: CEOMessageBlockProps['portraitPosition'] =
    rawPosition === 'left' || rawPosition === 'right' ? rawPosition : 'left'

  // UPDATE: Added 'black' to the validation condition so it parses correctly from the admin payload data
  const rawBg = data['backgroundStyle']
  const backgroundStyle: CEOMessageBlockProps['backgroundStyle'] =
    rawBg === 'white' || rawBg === 'light' || rawBg === 'black' ? rawBg : 'white'

  return {
    portraitUrl,
    portraitAlt: typeof data['portraitAlt'] === 'string' ? data['portraitAlt'] : '',
    name: typeof data['name'] === 'string' ? data['name'] : '',
    title: typeof data['title'] === 'string' ? data['title'] : '',
    message: extractRichText(data['message']),
    portraitPosition,
    backgroundStyle,
    ...(signatureUrl ? { signatureUrl } : {}),
  }
}