import { toIdString } from '../../../../payload/lib/to-id-string'
import type { DepartmentListBlockProps, DepartmentCardItem } from './types'

function mapDepartment(doc: Record<string, unknown>): DepartmentCardItem | null {
  const id = toIdString(doc['id'])
  const title = typeof doc['title'] === 'string' ? doc['title'] : ''
  if (!id || !title) return null

  const excerpt = typeof doc['excerpt'] === 'string' && doc['excerpt'] ? doc['excerpt'] : undefined
  const icon = typeof doc['icon'] === 'string' && doc['icon'] ? doc['icon'] : undefined
  const slug = typeof doc['slug'] === 'string' && doc['slug'] ? doc['slug'] : undefined

  const thumbnail = doc['thumbnail'] as Record<string, unknown> | null | undefined
  const imageUrl = thumbnail && typeof thumbnail['url'] === 'string' ? thumbnail['url'] : undefined

  return {
    id,
    title,
    ...(excerpt ? { excerpt } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(icon ? { icon } : {}),
    ...(slug ? { slug } : {}),
  }
}

export function adaptDepartmentListBlock(raw: unknown): DepartmentListBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawDepartments = Array.isArray(data['departments']) ? data['departments'] : []
  const departments = rawDepartments
    .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
    .map(mapDepartment)
    .filter((d): d is DepartmentCardItem => d !== null)

  const rawColumns = data['columns']
  const columns: '2' | '3' = rawColumns === '2' ? '2' : '3'

  return {
    departments,
    columns,
    ...(typeof data['eyebrow'] === 'string' && data['eyebrow'] ? { eyebrow: data['eyebrow'] } : {}),
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['subheadline'] === 'string' && data['subheadline'] ? { subheadline: data['subheadline'] } : {}),
  }
}
