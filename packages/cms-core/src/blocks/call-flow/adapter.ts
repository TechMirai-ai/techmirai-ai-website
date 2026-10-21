import type { CallFlowBlockProps } from './types'

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    : []
}

export function adaptCallFlowBlock(raw: unknown): CallFlowBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  return {
    heading: str(data['heading']),
    intro: str(data['intro']),
    steps: rows(data['steps'])
      .map((r) => ({ label: str(r['label']) }))
      .filter((r) => r.label),
    pauseLabel: str(data['pauseLabel']) || 'Pause animation',
    playLabel: str(data['playLabel']) || 'Play animation',
    dashboardHeading: str(data['dashboardHeading']),
    dashboardNote: str(data['dashboardNote']),
    dashboardFields: rows(data['dashboardFields']).map((r) => ({ label: str(r['label']), value: str(r['value']) })),
    aiHeading: str(data['aiHeading']),
    aiItems: rows(data['aiItems']).map((r) => str(r['text'])).filter(Boolean),
    humanHeading: str(data['humanHeading']),
    humanItems: rows(data['humanItems']).map((r) => str(r['text'])).filter(Boolean),
  }
}
