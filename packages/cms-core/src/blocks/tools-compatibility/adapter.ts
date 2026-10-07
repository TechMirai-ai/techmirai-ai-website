import type { ToolsCompatibilityBlockProps } from './types'

export function adaptToolsCompatibilityBlock(raw: unknown): ToolsCompatibilityBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (key: string): string => (typeof data[key] === 'string' ? (data[key] as string) : '')

  const heading = str('heading')
  const col1Title = str('col1Title')
  const col2Title = str('col2Title')
  const col3Title = str('col3Title')
  const body = str('body')
  const col1List = str('col1List')
  const col2List = str('col2List')
  const col3Body = str('col3Body')
  const linkLabel = str('linkLabel')
  const linkHref = str('linkHref')

  return {
    heading,
    col1Title,
    col2Title,
    col3Title,
    ...(body ? { body } : {}),
    ...(col1List ? { col1List } : {}),
    ...(col2List ? { col2List } : {}),
    ...(col3Body ? { col3Body } : {}),
    ...(linkLabel ? { linkLabel } : {}),
    ...(linkHref ? { linkHref } : {}),
  }
}
