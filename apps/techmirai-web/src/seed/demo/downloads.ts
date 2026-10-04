import type { Payload } from 'payload'

const DOWNLOADS = [
  { title: 'Demo Service Brochure', category: 'Services', meta: '12 pages' },
  { title: 'Demo Hiring Guide', category: 'Hiring Guide', meta: '20 pages' },
  { title: 'Demo Onboarding Handbook', category: 'Onboarding', meta: '16 pages' },
  { title: 'Demo Cost Calculator', category: 'Tools', meta: 'PDF' },
  { title: 'Demo Compliance Checklist', category: 'Compliance', meta: '4 pages' },
]

export async function seedDemoDownloads(payload: Payload, fileIds: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const [i, item] of DOWNLOADS.entries()) {
    const doc = await payload.create({
      collection: 'downloads',
      locale: 'ja',
      data: {
        title: item.title,
        description: 'This is a sample downloadable resource — replace with real content.',
        file: fileIds[i]!,
        category: item.category,
        meta: item.meta,
        slug: `demo-download-${i + 1}`,
        active: true,
        aiVisible: true,
      },
    })
    ids.push(doc.id as string)
  }
  return ids
}
