export * from './spacing'
export * from './breakpoints'
export * from './radii'

import type { CSSProperties } from 'react'
import type { SiteConfig } from '../schema/site-config'

export function buildCssVariables(siteConfig: SiteConfig): CSSProperties {
  const { colors } = siteConfig.brand
  const { typography } = siteConfig.brand

  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-text': colors.text,
    '--color-muted': colors.muted,
    '--color-error': colors.error,
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    ...(colors.surfaceAlt && { '--color-surface-alt': colors.surfaceAlt }),
    ...(colors.surfaceSubtle && { '--color-surface-subtle': colors.surfaceSubtle }),
    ...(colors.surfaceFaint && { '--color-surface-faint': colors.surfaceFaint }),
    ...(colors.textSecondary && { '--color-text-secondary': colors.textSecondary }),
    ...(colors.headingDark && { '--color-heading-dark': colors.headingDark }),
    ...(colors.deepAccent && { '--color-deep-accent': colors.deepAccent }),
    ...(colors.iconAccent && { '--color-icon-accent': colors.iconAccent }),
    ...(colors.buttonAccent && { '--color-button-accent': colors.buttonAccent }),
    ...(colors.buttonAccentHover && { '--color-button-accent-hover': colors.buttonAccentHover }),
    ...(colors.priceHighlight && { '--color-price-highlight': colors.priceHighlight }),
    '--font-sans': `${typography.fontSans}, system-ui, sans-serif`,
    '--font-serif': `${typography.fontSerif ?? 'Georgia'}, serif`,
    '--font-mono': `${typography.fontMono ?? 'ui-monospace'}, monospace`,
    '--font-size-base': typography.fontSizeBase,
    '--font-weight-heading': typography.fontWeightHeading,
    '--font-weight-body': typography.fontWeightBody,
  } as CSSProperties
}

export function buildLocaleFont(
  locale: string,
  siteConfig: SiteConfig,
): { fontSans?: string | undefined; fontSerif?: string | undefined } | undefined {
  return siteConfig.brand.typography.perLocale?.[locale]
}
