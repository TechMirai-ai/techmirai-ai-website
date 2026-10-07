import type { SecurityPointsBlockProps, SecurityPoint } from './types'

export function adaptSecurityPointsBlock(raw: unknown): SecurityPointsBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawPoints = Array.isArray(data['points']) ? data['points'] : []
  const points: SecurityPoint[] = rawPoints
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map((p) => ({ text: typeof p['text'] === 'string' ? p['text'] : '' }))
    .filter((p) => p.text)

  const heading = typeof data['heading'] === 'string' ? data['heading'] : ''
  const buttonLabel = typeof data['buttonLabel'] === 'string' && data['buttonLabel'] ? data['buttonLabel'] : ''
  const buttonHref = typeof data['buttonHref'] === 'string' && data['buttonHref'] ? data['buttonHref'] : ''

  return {
    heading,
    points,
    ...(buttonLabel ? { buttonLabel } : {}),
    ...(buttonHref ? { buttonHref } : {}),
  }
}
