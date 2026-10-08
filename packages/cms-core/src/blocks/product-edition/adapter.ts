import type { ProductEditionBlockProps, ProductEditionWayToStart } from './types'

export function adaptProductEditionBlock(raw: unknown): ProductEditionBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (key: string): string => (typeof data[key] === 'string' ? (data[key] as string) : '')

  const rawWays = Array.isArray(data['waysToStart']) ? (data['waysToStart'] as { text?: string }[]) : []
  const waysToStart: ProductEditionWayToStart[] = rawWays
    .map((w) => ({ text: w.text ?? '' }))
    .filter((w) => w.text)

  return {
    heading: str('heading'),
    ...(str('badge') ? { badge: str('badge') } : {}),
    ...(str('body') ? { body: str('body') } : {}),
    ...(str('itemsList') ? { itemsList: str('itemsList') } : {}),
    ...(waysToStart.length ? { waysToStart } : {}),
    ...(str('closingLine') ? { closingLine: str('closingLine') } : {}),
    ...(str('buttonLabel') ? { buttonLabel: str('buttonLabel') } : {}),
    ...(str('buttonHref') ? { buttonHref: str('buttonHref') } : {}),
  }
}
