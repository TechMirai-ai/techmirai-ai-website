import type { TeamGridBlockProps } from './types'

export function adaptTeamGridBlock(_raw: unknown): TeamGridBlockProps {
  return { memberIds: [], columns: '3', showBio: false }
}
