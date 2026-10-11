import type { LabelValueListBlockProps, LabelValueRow } from './types'

export function adaptLabelValueListBlock(raw: unknown): LabelValueListBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawRows = Array.isArray(data['rows']) ? data['rows'] : []
  const rows: LabelValueRow[] = rawRows
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      label: typeof r['label'] === 'string' ? r['label'] : '',
      detail: typeof r['detail'] === 'string' ? r['detail'] : '',
    }))
    .filter((r) => r.label)

  const heading = typeof data['heading'] === 'string' && data['heading'] ? data['heading'] : ''
  const intro = typeof data['intro'] === 'string' && data['intro'] ? data['intro'] : ''
  const footnote = typeof data['footnote'] === 'string' && data['footnote'] ? data['footnote'] : ''

  return {
    rows,
    ...(heading ? { heading } : {}),
    ...(intro ? { intro } : {}),
    ...(footnote ? { footnote } : {}),
  }
}
