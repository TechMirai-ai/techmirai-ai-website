import type { ContactFormBlockProps } from './types'

export function adaptContactFormBlock(_raw: unknown): ContactFormBlockProps {
  return { variant: 'contact', showTurnstile: true }
}
