import type { ProcessStepsBlockProps, ProcessStep } from './types'

export function adaptProcessStepsBlock(raw: unknown): ProcessStepsBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawSteps = Array.isArray(data['steps']) ? data['steps'] : []
  const steps: ProcessStep[] = rawSteps
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => {
      const title = typeof s['title'] === 'string' && s['title'] ? s['title'] : ''
      return {
        line: typeof s['line'] === 'string' ? s['line'] : '',
        ...(title ? { title } : {}),
      }
    })
    .filter((s) => s.line)

  const heading = typeof data['heading'] === 'string' ? data['heading'] : ''
  const sub = typeof data['sub'] === 'string' && data['sub'] ? data['sub'] : ''

  return {
    heading,
    steps,
    ...(sub ? { sub } : {}),
  }
}
