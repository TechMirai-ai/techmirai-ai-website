import type { PricingTeaserBlockProps } from './types'

export function adaptPricingTeaserBlock(raw: unknown): PricingTeaserBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (key: string): string => (typeof data[key] === 'string' ? (data[key] as string) : '')

  return {
    heading: str('heading'),
    packageName: str('packageName'),
    priceLine1: str('priceLine1'),
    priceLine2: str('priceLine2'),
    ...(str('includesList') ? { includesList: str('includesList') } : {}),
    ...(str('note') ? { note: str('note') } : {}),
    ...(str('buttonLabel') ? { buttonLabel: str('buttonLabel') } : {}),
    ...(str('buttonHref') ? { buttonHref: str('buttonHref') } : {}),
  }
}
