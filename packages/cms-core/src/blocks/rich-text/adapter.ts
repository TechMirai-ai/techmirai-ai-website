import type { RichTextBlockProps } from './types'

export function adaptRichTextBlock(raw: any): RichTextBlockProps {
  if (!raw) {
    return { content: null }
  }

  return {
    content: raw.content,           // Lexical JSON content from Payload
    maxWidth: raw.maxWidth || 'prose',
    id: raw.id,
  }
}