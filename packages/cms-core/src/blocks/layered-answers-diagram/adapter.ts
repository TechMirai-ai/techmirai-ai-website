import type { LayeredAnswersDiagramBlockProps, LayeredAnswersStep } from './types'

export function adaptLayeredAnswersDiagramBlock(raw: unknown): LayeredAnswersDiagramBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawSteps = Array.isArray(data['steps']) ? data['steps'] : []
  const steps: LayeredAnswersStep[] = rawSteps
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      label: typeof s['label'] === 'string' ? s['label'] : '',
    }))
    .filter((s) => s.label)

  return { steps }
}
