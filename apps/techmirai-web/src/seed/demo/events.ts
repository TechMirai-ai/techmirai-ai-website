import type { Payload } from 'payload'

const EVENTS = [
  { title: 'Demo Job Fair One', location: 'Sample City Convention Center', startDate: '2026-08-10' },
  { title: 'Demo Job Fair Two', location: 'Sample Town Community Hall', startDate: '2026-08-24' },
  { title: 'Demo Info Session One', location: 'Online', startDate: '2026-09-02' },
  { title: 'Demo Info Session Two', location: 'Sample Regional Office', startDate: '2026-09-15' },
  { title: 'Demo Networking Event', location: 'Sample Hotel Ballroom', startDate: '2026-09-28' },
]

/** Only called when `siteConfig.features.events` is enabled — the `events` collection doesn't exist otherwise. */
export async function seedDemoEvents(payload: Payload, thumbnailIds: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const [i, event] of EVENTS.entries()) {
    const doc = await payload.create({
      collection: 'events',
      locale: 'ja',
      data: {
        title: event.title,
        startDate: event.startDate,
        location: event.location,
        excerpt: 'This is a sample event description — replace with real content.',
        thumbnail: thumbnailIds[i]!,
        category: 'Event',
        slug: `demo-event-${i + 1}`,
        aiVisible: true,
      },
    })
    ids.push(doc.id as string)
  }
  return ids
}
