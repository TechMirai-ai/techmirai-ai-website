import type { PageHeroBlockProps, PageHeroBreadcrumbItem, PageHeroProfileCard, PageHeroProfileCardRow } from './types'

export function adaptPageHeroBlock(raw: unknown): PageHeroBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawVariant = data['variant']
  const variant: PageHeroBlockProps['variant'] =
    rawVariant === 'page-title' ? 'page-title' : 'hero'

  const rawAlignment = data['textAlignment']
  const textAlignment: PageHeroBlockProps['textAlignment'] =
    rawAlignment === 'center' ? 'center' : 'left'

  const rawMinHeight = data['minHeight']
  const minHeight: PageHeroBlockProps['minHeight'] =
    rawMinHeight === 'sm' || rawMinHeight === 'md' || rawMinHeight === 'lg' ? rawMinHeight : 'md'

  const rawOverlayColor = data['overlayColor']
  const overlayColor: PageHeroBlockProps['overlayColor'] =
    rawOverlayColor === 'brand' || rawOverlayColor === 'none' ? rawOverlayColor : 'black'

  const rawOpacity = data['overlayOpacity']
  const overlayOpacity = typeof rawOpacity === 'number' ? rawOpacity : 50

  // ---------- Background Image (more robust) ----------
  const bgImage = data['backgroundImage'] as any
  let backgroundImageUrl: string | undefined

  if (bgImage && typeof bgImage === 'object') {
    // Common Payload shapes
    const rawUrl =
      (typeof bgImage.url === 'string' && bgImage.url) ||
      (typeof bgImage.filename === 'string' && bgImage.filename) ||
      (typeof bgImage.sizes?.large?.url === 'string' && bgImage.sizes.large.url) ||
      (typeof bgImage.sizes?.medium?.url === 'string' && bgImage.sizes.medium.url)

    if (rawUrl) {
      backgroundImageUrl =
        rawUrl.startsWith('http') || rawUrl.startsWith('/')
          ? rawUrl
          : `/${rawUrl}`
    }
  }
  // -----------------------------------------------------

  const rawBreadcrumbs = Array.isArray(data['breadcrumbItems']) ? data['breadcrumbItems'] : []
  const breadcrumbItems: PageHeroBreadcrumbItem[] = rawBreadcrumbs
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      label: typeof item['label'] === 'string' ? item['label'] : '',
      ...(typeof item['href'] === 'string' && item['href'] ? { href: item['href'] } : {}),
    }))
    .filter((item) => item.label)

  const primaryBtn = data['primaryButton'] as Record<string, unknown> | null | undefined
  const primaryButton =
    primaryBtn &&
    typeof primaryBtn['label'] === 'string' && primaryBtn['label'] &&
    typeof primaryBtn['href'] === 'string' && primaryBtn['href']
      ? { label: primaryBtn['label'], href: primaryBtn['href'] }
      : undefined

  const secondaryBtn = data['secondaryButton'] as Record<string, unknown> | null | undefined
  const secondaryButton =
    secondaryBtn && typeof secondaryBtn['label'] === 'string' && secondaryBtn['label']
      ? {
          label: secondaryBtn['label'],
          ...(typeof secondaryBtn['href'] === 'string' ? { href: secondaryBtn['href'] } : {}),
        }
      : undefined

  const rawCard = data['profileCard'] as Record<string, unknown> | null | undefined
  let profileCard: PageHeroProfileCard | undefined
  if (rawCard && typeof rawCard['cardHeading'] === 'string' && rawCard['cardHeading']) {
    const rawRows = Array.isArray(rawCard['rows']) ? rawCard['rows'] : []
    const rows: PageHeroProfileCardRow[] = rawRows
      .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map((r) => ({
        label: typeof r['label'] === 'string' ? r['label'] : '',
        value: typeof r['value'] === 'string' ? r['value'] : '',
      }))
      .filter((r) => r.label)
    profileCard = {
      cardHeading: rawCard['cardHeading'],
      ...(typeof rawCard['badgeText'] === 'string' && rawCard['badgeText']
        ? { badgeText: rawCard['badgeText'] }
        : {}),
      ...(rows.length > 0 ? { rows } : {}),
    }
  }

  return {
    variant,
    textAlignment,
    minHeight,
    overlayColor,
    overlayOpacity,
    showBreadcrumb: typeof data['showBreadcrumb'] === 'boolean' ? data['showBreadcrumb'] : false,
    ...(breadcrumbItems.length > 0 ? { breadcrumbItems } : {}),
    ...(variant === 'hero'
      ? {
          ...(typeof data['eyebrow'] === 'string' && data['eyebrow'] ? { eyebrow: data['eyebrow'] } : {}),
          ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
          ...(typeof data['coloredSubtitle'] === 'string' && data['coloredSubtitle']
            ? { coloredSubtitle: data['coloredSubtitle'] }
            : {}),
          ...(typeof data['body'] === 'string' && data['body'] ? { body: data['body'] } : {}),
          ...(backgroundImageUrl ? { backgroundImageUrl } : {}),
          ...(primaryButton ? { primaryButton } : {}),
          ...(secondaryButton ? { secondaryButton } : {}),
          ...(typeof data['smallPrint'] === 'string' && data['smallPrint']
            ? { smallPrint: data['smallPrint'] }
            : {}),
          ...(profileCard ? { profileCard } : {}),
        }
      : {
          ...(typeof data['pageTitle'] === 'string' && data['pageTitle']
            ? { pageTitle: data['pageTitle'] }
            : {}),
        }),
  }
}