import type { IntegrationsStatusTableBlockProps, IntegrationRow, IntegrationStatus } from './types'

function coerceStatus(value: unknown): IntegrationStatus {
  switch (value) {
    case 'case-by-case':
    case 'in-development':
    case 'not-offered':
      return value
    default:
      return 'available'
  }
}

export function adaptIntegrationsStatusTableBlock(raw: unknown): IntegrationsStatusTableBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawRows = Array.isArray(data['rows']) ? data['rows'] : []
  const rows: IntegrationRow[] = rawRows
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      name: typeof r['name'] === 'string' ? r['name'] : '',
      status: coerceStatus(r['status']),
      description: typeof r['description'] === 'string' ? r['description'] : '',
    }))
    .filter((r) => r.name)

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
