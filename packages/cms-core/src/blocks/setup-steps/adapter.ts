import type { SetupStepsBlockProps, SetupStep } from './types'

export function adaptSetupStepsBlock(raw: unknown): SetupStepsBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawSteps = Array.isArray(data['steps']) ? data['steps'] : []
  const steps: SetupStep[] = rawSteps
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      name: typeof s['name'] === 'string' ? s['name'] : '',
      description: typeof s['description'] === 'string' ? s['description'] : '',
      need: typeof s['need'] === 'string' ? s['need'] : '',
    }))
    .filter((s) => s.name)

  const heading = typeof data['heading'] === 'string' && data['heading'] ? data['heading'] : ''
  const sub = typeof data['sub'] === 'string' && data['sub'] ? data['sub'] : ''
  const footnote = typeof data['footnote'] === 'string' && data['footnote'] ? data['footnote'] : ''

  return {
    steps,
    ...(heading ? { heading } : {}),
    ...(sub ? { sub } : {}),
    ...(footnote ? { footnote } : {}),
  }
}
