import type { CaseStudiesGridBlockProps, CaseStudyCardItem, CaseStudiesLayout } from './types'

function extractRichText(rt: unknown): string {
  if (typeof rt === 'string') return rt
  if (typeof rt !== 'object' || rt === null) return ''
  const root = (rt as Record<string, unknown>)['root']
  if (typeof root !== 'object' || root === null) return ''
  const children = (root as Record<string, unknown>)['children']
  if (!Array.isArray(children)) return ''
  return (children as unknown[]).map(extractNodeText).join(' ').trim()
}

function extractNodeText(node: unknown): string {
  if (typeof node !== 'object' || node === null) return ''
  const n = node as Record<string, unknown>
  if (typeof n['text'] === 'string') return n['text']
  if (Array.isArray(n['children'])) return (n['children'] as unknown[]).map(extractNodeText).join('')
  return ''
}

function mapCollectionStudy(doc: Record<string, unknown>): CaseStudyCardItem | null {
  const name = typeof doc['clientName'] === 'string' ? doc['clientName'] : ''
  if (!name) return null
  const slug = typeof doc['slug'] === 'string' && doc['slug'] ? doc['slug'] : undefined
  const role = typeof doc['role'] === 'string' && doc['role'] ? doc['role'] : undefined
  const metricValue = typeof doc['metricValue'] === 'string' ? doc['metricValue'] : ''
  const metricCaption = typeof doc['metricCaption'] === 'string' ? doc['metricCaption'] : ''

  const photo = doc['photo'] as Record<string, unknown> | null | undefined
  const photoUrl = photo && typeof photo['url'] === 'string' ? photo['url'] : undefined

  const tagline = extractRichText(doc['tagline'])

  return {
    name,
    ...(slug ? { slug } : {}),
    ...(role ? { role } : {}),
    ...(metricValue && metricCaption ? { metric: { value: metricValue, caption: metricCaption } } : {}),
    ...(extractRichText(doc['challenge']) ? { challenge: extractRichText(doc['challenge']) } : {}),
    ...(extractRichText(doc['solution']) ? { solution: extractRichText(doc['solution']) } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(tagline ? { tagline } : {}),           // ← Added
  }
}

function mapInlineStudy(item: Record<string, unknown>): CaseStudyCardItem | null {
  const name = typeof item['name'] === 'string' ? item['name'] : ''
  if (!name) return null

  const role = typeof item['role'] === 'string' && item['role'] ? item['role'] : undefined
  const metricRaw = item['metric'] as Record<string, unknown> | null | undefined
  const metricValue = metricRaw && typeof metricRaw['value'] === 'string' ? metricRaw['value'] : ''
  const metricCaption = metricRaw && typeof metricRaw['caption'] === 'string' ? metricRaw['caption'] : ''

  const photo = item['photo'] as Record<string, unknown> | null | undefined
  const photoUrl = photo && typeof photo['url'] === 'string' ? photo['url'] : undefined

  const challenge = typeof item['challenge'] === 'string' && item['challenge'] ? item['challenge'] : undefined
  const solution = typeof item['solution'] === 'string' && item['solution'] ? item['solution'] : undefined
  const tagline = typeof item['tagline'] === 'string' && item['tagline'] ? item['tagline'] : undefined

  return {
    name,
    ...(role ? { role } : {}),
    ...(metricValue && metricCaption ? { metric: { value: metricValue, caption: metricCaption } } : {}),
    ...(challenge ? { challenge } : {}),
    ...(solution ? { solution } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(tagline ? { tagline } : {}),           // ← Added
  }
}

export function adaptCaseStudiesGridBlock(raw: unknown): CaseStudiesGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const source = data['source'] === 'inline' ? 'inline' : 'collection'
  const rawLayout = data['layout']
  const layout: CaseStudiesLayout =
    rawLayout === 'grid' || rawLayout === 'carousel' ? rawLayout : 'stacked'

  let studies: CaseStudyCardItem[] = []

  if (source === 'collection') {
    const rawStudies = Array.isArray(data['selectedStudies']) ? data['selectedStudies'] : []
    studies = rawStudies
      .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
      .map(mapCollectionStudy)
      .filter((s): s is CaseStudyCardItem => s !== null)
  } else {
    const rawInline = Array.isArray(data['inlineStudies']) ? data['inlineStudies'] : []
    studies = rawInline
      .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
      .map(mapInlineStudy)
      .filter((s): s is CaseStudyCardItem => s !== null)
  }

  const challengeLabel = typeof data['challengeLabel'] === 'string' && data['challengeLabel']
    ? data['challengeLabel'] : 'Challenge'
  const solutionLabel = typeof data['solutionLabel'] === 'string' && data['solutionLabel']
    ? data['solutionLabel'] : 'Solution'

  const buttonRaw = data['button'] as Record<string, unknown> | null | undefined
  const button = buttonRaw
    ? {
        ...(typeof buttonRaw['label'] === 'string' && buttonRaw['label'] ? { label: buttonRaw['label'] } : {}),
        ...(typeof buttonRaw['href'] === 'string' && buttonRaw['href'] ? { href: buttonRaw['href'] } : {}),
      }
    : undefined

  return {
    studies,
    layout,
    challengeLabel,
    solutionLabel,
    ...(typeof data['eyebrow'] === 'string' && data['eyebrow'] ? { eyebrow: data['eyebrow'] } : {}),
    ...(typeof data['heading'] === 'string' && data['heading'] ? { heading: data['heading'] } : {}),
    ...(typeof data['subheadline'] === 'string' && data['subheadline'] ? { subheadline: data['subheadline'] } : {}),
    ...(button ? { button } : {}),
  }
}