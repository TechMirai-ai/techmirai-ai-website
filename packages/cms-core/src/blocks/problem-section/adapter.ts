import type { ProblemSectionBlockProps, ProblemSectionJourneyStep, ProblemSectionCard } from './types'

export function adaptProblemSectionBlock(raw: unknown): ProblemSectionBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawSteps = Array.isArray(data['journeySteps']) ? data['journeySteps'] : []
  const journeySteps: ProblemSectionJourneyStep[] = rawSteps
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({ text: typeof s['text'] === 'string' ? s['text'] : '' }))
    .filter((s) => s.text)

  const rawCards = Array.isArray(data['cards']) ? data['cards'] : []
  const cards: ProblemSectionCard[] = rawCards
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({ text: typeof c['text'] === 'string' ? c['text'] : '' }))
    .filter((c) => c.text)

  const heading = typeof data['heading'] === 'string' ? data['heading'] : ''
  const intro = typeof data['intro'] === 'string' && data['intro'] ? data['intro'] : ''
  const journeyCaption = typeof data['journeyCaption'] === 'string' && data['journeyCaption'] ? data['journeyCaption'] : ''
  const navyBandText = typeof data['navyBandText'] === 'string' && data['navyBandText'] ? data['navyBandText'] : ''
  const closingLine = typeof data['closingLine'] === 'string' && data['closingLine'] ? data['closingLine'] : ''

  return {
    heading,
    cards,
    ...(intro ? { intro } : {}),
    ...(journeySteps.length > 0 ? { journeySteps } : {}),
    ...(journeyCaption ? { journeyCaption } : {}),
    ...(navyBandText ? { navyBandText } : {}),
    ...(closingLine ? { closingLine } : {}),
  }
}
