import { lexicalToText } from '../../../../payload/lib/richtext-to-text'
import { toIdString } from '../../../../payload/lib/to-id-string'
import type { DoctorGridBlockProps, DoctorCardItem } from './types'

function mapDoctor(doc: Record<string, unknown>): DoctorCardItem | null {
  const id = toIdString(doc['id'])
  const name = typeof doc['name'] === 'string' ? doc['name'] : ''
  if (!id || !name) return null

  const title = typeof doc['title'] === 'string' && doc['title'] ? doc['title'] : undefined
  const slug = typeof doc['slug'] === 'string' && doc['slug'] ? doc['slug'] : undefined

  const photo = doc['photo'] as Record<string, unknown> | null | undefined
  const photoUrl = photo && typeof photo['url'] === 'string' ? photo['url'] : undefined

  const rawSpecialties = Array.isArray(doc['specialties']) ? doc['specialties'] : []
  const specialties = rawSpecialties
    .map((s) => (typeof s === 'object' && s !== null ? (s as Record<string, unknown>)['title'] : undefined))
    .filter((t): t is string => typeof t === 'string' && t.length > 0)

  const yearsOfExperience = typeof doc['yearsOfExperience'] === 'number' ? doc['yearsOfExperience'] : undefined

  const bio = lexicalToText(doc['bio'])

  return {
    id,
    name,
    specialties,
    ...(title ? { title } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(yearsOfExperience !== undefined ? { yearsOfExperience } : {}),
    ...(bio ? { bio } : {}),
    ...(slug ? { slug } : {}),
  }
}

export function adaptDoctorGridBlock(raw: unknown): DoctorGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawDoctors = Array.isArray(data['doctors']) ? data['doctors'] : []
  const doctors = rawDoctors
    .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
    .map(mapDoctor)
    .filter((d): d is DoctorCardItem => d !== null)

  const rawColumns = data['columns']
  const columns: '3' | '4' = rawColumns === '4' ? '4' : '3'

  return {
    doctors,
    columns,
    showBio: data['showBio'] === true,
    ...(typeof data['eyebrow'] === 'string' && data['eyebrow'] ? { eyebrow: data['eyebrow'] } : {}),
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['subheadline'] === 'string' && data['subheadline'] ? { subheadline: data['subheadline'] } : {}),
  }
}
