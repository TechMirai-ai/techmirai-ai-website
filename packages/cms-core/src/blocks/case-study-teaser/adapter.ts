import type { CaseStudyTeaserBlockProps } from './types'

export function adaptCaseStudyTeaserBlock(raw: unknown): CaseStudyTeaserBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (key: string): string => (typeof data[key] === 'string' ? (data[key] as string) : '')

  const heading = str('heading')
  const body = str('body')
  const statsStrip = str('statsStrip')
  const note = str('note')
  const buttonLabel = str('buttonLabel')
  const buttonHref = str('buttonHref')

  return {
    heading,
    visible: data['visible'] === true,
    ...(body ? { body } : {}),
    ...(statsStrip ? { statsStrip } : {}),
    ...(note ? { note } : {}),
    ...(buttonLabel ? { buttonLabel } : {}),
    ...(buttonHref ? { buttonHref } : {}),
  }
}
