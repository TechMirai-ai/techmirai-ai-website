import type { EventListBlockProps } from './types'

export function adaptEventListBlock(_raw: unknown): EventListBlockProps {
  return { limit: 3, showPastToggle: false }
}
