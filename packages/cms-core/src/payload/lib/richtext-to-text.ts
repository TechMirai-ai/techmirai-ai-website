/**
 * Converts a Payload Lexical SerializedEditorState to a plain-text string.
 * Walks the node tree recursively, concatenating all text nodes.
 * Used for AI corpus extraction — not intended for HTML rendering.
 */

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  root?: LexicalNode
}

function walk(node: LexicalNode): string {
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text
  }

  if (node.root) {
    return walk(node.root)
  }

  if (Array.isArray(node.children) && node.children.length > 0) {
    const parts = node.children.map(walk).filter(Boolean)
    const separator = node.type === 'paragraph' || node.type === 'heading' ? '\n' : ' '
    return parts.join(separator)
  }

  return ''
}

export function lexicalToText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  return walk(value as LexicalNode).replace(/\n{3,}/g, '\n\n').trim()
}
