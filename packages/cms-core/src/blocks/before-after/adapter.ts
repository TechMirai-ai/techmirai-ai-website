import type { BeforeAfterBlockProps, BeforeAfterRow } from './types'

export function adaptBeforeAfterBlock(raw: unknown): BeforeAfterBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawRows = Array.isArray(data['rows']) ? data['rows'] : []
  const rows: BeforeAfterRow[] = rawRows
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      area: typeof r['area'] === 'string' ? r['area'] : '',
      before: typeof r['before'] === 'string' ? r['before'] : '',
      after: typeof r['after'] === 'string' ? r['after'] : '',
    }))
    .filter((r) => r.area)

  const heading = typeof data['heading'] === 'string' ? data['heading'] : ''
  const sub = typeof data['sub'] === 'string' && data['sub'] ? data['sub'] : ''
  const beforeLabel = typeof data['beforeLabel'] === 'string' ? data['beforeLabel'] : 'Before'
  const afterLabel = typeof data['afterLabel'] === 'string' ? data['afterLabel'] : 'After'

  return {
    heading,
    beforeLabel,
    afterLabel,
    rows,
    ...(sub ? { sub } : {}),
  }
}
