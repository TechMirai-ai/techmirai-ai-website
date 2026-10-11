import type { TeamGridBlockProps, TeamGridCardMember } from './types'
import { extractRichText } from '../../lib/extract-rich-text'

interface RawTeamDoc {
  id: string | number
  name?: string
  title?: string
  shortBio?: string
  bio?: unknown
  visible?: boolean
  photo?: { url?: string } | string | null
}

/**
 * `founderVisible`/`founderPersonId` are injected by the consuming app's
 * page renderer (not stored Payload fields) — same pattern as
 * `case-study-teaser`'s `visible`. See
 * apps/techmirai-web/src/app/(frontend)/[locale]/page.tsx.
 */
export function adaptTeamGridBlock(raw: unknown): TeamGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawMembers = Array.isArray(data['members']) ? (data['members'] as (RawTeamDoc | string)[]) : []
  const founderVisible = data['founderVisible'] !== false
  const founderPersonId = data['founderPersonId'] != null ? String(data['founderPersonId']) : undefined

  const members: TeamGridCardMember[] = rawMembers
    .filter((m): m is RawTeamDoc => typeof m === 'object' && m !== null)
    // Per-person consent gate — already on the populated relationship doc.
    .filter((m) => m.visible !== false)
    // Site-wide founder gate — the one switch meant to remove Jamal everywhere.
    .filter((m) => founderVisible || String(m.id) !== founderPersonId)
    .map((m) => {
      const photoUrl = typeof m.photo === 'object' && m.photo !== null ? m.photo.url : undefined
      const fullBio = extractRichText(m.bio)
      return {
        id: String(m.id),
        name: m.name ?? '',
        title: m.title ?? '',
        ...(m.shortBio ? { line: m.shortBio } : {}),
        ...(fullBio ? { fullBio } : {}),
        ...(photoUrl ? { photoUrl } : {}),
      }
    })
    .filter((m) => m.name)

  const partnerRaw = (data['partner'] ?? {}) as Record<string, unknown>
  const partnerName = typeof partnerRaw['name'] === 'string' ? partnerRaw['name'] : ''
  const partnerPhoto = partnerRaw['photo'] as { url?: string } | string | null | undefined
  const partnerPhotoUrl = typeof partnerPhoto === 'object' && partnerPhoto !== null ? partnerPhoto.url : undefined

  const bulletsRaw = Array.isArray(data['bullets']) ? (data['bullets'] as { text?: string }[]) : []
  const bullets = bulletsRaw.map((b) => b.text ?? '').filter(Boolean)

  const str = (key: string): string => (typeof data[key] === 'string' ? (data[key] as string) : '')

  return {
    sectionHeading: str('sectionHeading'),
    ...(str('intro') ? { intro: str('intro') } : {}),
    ...(bullets.length ? { bullets } : {}),
    members,
    ...(partnerName
      ? {
          partner: {
            name: partnerName,
            ...(typeof partnerRaw['role'] === 'string' && partnerRaw['role'] ? { role: partnerRaw['role'] as string } : {}),
            ...(typeof partnerRaw['line'] === 'string' && partnerRaw['line'] ? { line: partnerRaw['line'] as string } : {}),
            ...(typeof partnerRaw['clarityLine'] === 'string' && partnerRaw['clarityLine']
              ? { clarityLine: partnerRaw['clarityLine'] as string }
              : {}),
            ...(partnerPhotoUrl ? { photoUrl: partnerPhotoUrl } : {}),
          },
        }
      : {}),
    columns: data['columns'] === '4' ? '4' : '3',
    showBio: data['showBio'] === true,
    ...(str('buttonLabel') ? { buttonLabel: str('buttonLabel') } : {}),
    ...(str('buttonHref') ? { buttonHref: str('buttonHref') } : {}),
  }
}
