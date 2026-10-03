import type {
  CTABannerBlockProps,
  CTABannerVariant,
  CTABannerBackgroundStyle,
  CTABannerButtonVariant,
  CTABannerLayout,
} from './types'

// Map legacy variant values written before the rename, in case old seeds exist
const variantMap: Record<string, CTABannerVariant> = {
  filled: 'solid',
  outlined: 'gradient',
  'image-bg': 'image',
  solid: 'solid',
  gradient: 'gradient',
  image: 'image',
}

export function adaptCTABannerBlock(raw: unknown): CTABannerBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const primaryRaw = (data['primaryButton'] ?? {}) as Record<string, unknown>
  const secondaryRaw = (data['secondaryButton'] ?? {}) as Record<string, unknown>
  const bgImage = data['backgroundImage'] as Record<string, unknown> | null | undefined

  const rawVariant = typeof data['variant'] === 'string' ? data['variant'] : 'gradient'
  const variant: CTABannerVariant = variantMap[rawVariant] ?? 'gradient'

  const eyebrowStr = typeof data['eyebrow'] === 'string' && data['eyebrow'] ? data['eyebrow'] : ''
  const bodyStr = typeof data['body'] === 'string' && data['body'] ? data['body'] : ''
  const rawBgUrl = bgImage && typeof bgImage['url'] === 'string' ? bgImage['url'] : ''
  const bgUrl = rawBgUrl && (rawBgUrl.startsWith('/') || rawBgUrl.startsWith('https://'))
    ? rawBgUrl
    : ''

  const hasSecondary =
    typeof secondaryRaw['label'] === 'string' &&
    secondaryRaw['label'] &&
    typeof secondaryRaw['href'] === 'string' &&
    secondaryRaw['href']

  const rawBgStyle = data['backgroundStyle']
  const backgroundStyle: CTABannerBackgroundStyle =
    rawBgStyle === 'brand' || rawBgStyle === 'dark' || rawBgStyle === 'light' ? rawBgStyle : 'brand'

  const rawPrimaryVariant = data['primaryButtonVariant']
  const primaryButtonVariant: CTABannerButtonVariant =
    rawPrimaryVariant === 'solid' || rawPrimaryVariant === 'outline' ? rawPrimaryVariant : 'solid'

  const rawSecondaryVariant = secondaryRaw['variant']
  const secondaryButtonVariant: CTABannerButtonVariant =
    rawSecondaryVariant === 'solid' || rawSecondaryVariant === 'outline' ? rawSecondaryVariant : 'outline'

  const rawLayout = data['layout']
  const layout: CTABannerLayout =
    rawLayout === 'centered' || rawLayout === 'split' ? rawLayout : 'centered'

  return {
    heading: typeof data['heading'] === 'string' ? data['heading'] : '',
    primaryButton: {
      label: typeof primaryRaw['label'] === 'string' ? primaryRaw['label'] : '',
      href: typeof primaryRaw['href'] === 'string' ? primaryRaw['href'] : '#',
    },
    variant,
    backgroundStyle,
    primaryButtonVariant,
    layout,
    ...(eyebrowStr ? { eyebrow: eyebrowStr } : {}),
    ...(bodyStr ? { body: bodyStr } : {}),
    ...(hasSecondary
      ? {
          secondaryButton: { label: secondaryRaw['label'] as string, href: secondaryRaw['href'] as string },
          secondaryButtonVariant,
        }
      : {}),
    ...(bgUrl ? { backgroundImageUrl: bgUrl } : {}),
  }
}
