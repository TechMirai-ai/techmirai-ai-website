import type { Payload } from 'payload'

const DEMO_GALLERY_MARKER = 'demo-gallery'

/** Only called when `siteConfig.features.gallery` is enabled — the `gallery` collection doesn't exist otherwise. */
export async function seedDemoGallery(payload: Payload, imageIds: string[]): Promise<string[]> {
  const ids: string[] = []
  for (let i = 0; i < imageIds.length; i++) {
    const doc = await payload.create({
      collection: 'gallery',
      locale: 'ja',
      data: {
        image: imageIds[i],
        alt: `Demo gallery photo ${i + 1}`,
        caption: `Sample caption ${i + 1} — replace with real content.`,
        category: DEMO_GALLERY_MARKER,
        sortOrder: i + 1,
      },
    })
    ids.push(doc.id as string)
  }
  return ids
}
