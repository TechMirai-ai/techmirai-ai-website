import { getCachedPayload } from '@/lib/payload'

// Pack-4/L1: same `visible` gate as case-studies/sadiatec/page.tsx (Sadiatec's
// permission switch, PLACEHOLDER-REGISTER F1-14). Only the `visible` field is
// selected, so no unpublished case-study content is read. Fails closed.
export async function isCaseStudyVisible(): Promise<boolean> {
  try {
    const payload = await getCachedPayload()
    const res = await payload.find({
      collection: 'case-studies',
      where: { slug: { equals: 'sadiatec' } },
      limit: 1,
      depth: 0,
      select: { visible: true },
    })
    return res.docs[0]?.['visible'] === true
  } catch (error: unknown) {
    console.error('[seo] case-study visibility could not be read; treating it as hidden', error)
    return false
  }
}
