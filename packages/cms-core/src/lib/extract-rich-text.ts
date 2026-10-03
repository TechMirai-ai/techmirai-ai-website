function extractNodeText(node: unknown): string {
  if (typeof node !== 'object' || node === null) return ''
  const n = node as Record<string, unknown>
  if (typeof n['text'] === 'string') return n['text']
  if (Array.isArray(n['children'])) return (n['children'] as unknown[]).map(extractNodeText).join('')
  return ''
}

export function extractRichText(rt: unknown): string {
  if (typeof rt === 'string') return rt
  if (typeof rt !== 'object' || rt === null) return ''
  const root = (rt as Record<string, unknown>)['root']
  if (typeof root !== 'object' || root === null) return ''
  const children = (root as Record<string, unknown>)['children']
  if (!Array.isArray(children)) return ''
  return (children as unknown[]).map(extractNodeText).join('\n').trim()
}
