import type { Payload } from 'payload'

const TESTIMONIALS = [
  { name: 'Demo Client One', title: 'Operations Manager', rating: 5 },
  { name: 'Demo Client Two', title: 'HR Director', rating: 5 },
  { name: 'Demo Client Three', title: 'Factory Supervisor', rating: 4 },
  { name: 'Demo Client Four', title: 'Candidate', rating: 5 },
  { name: 'Demo Client Five', title: 'Candidate', rating: 4 },
  { name: 'Demo Client Six', title: 'Business Owner', rating: 5 },
]

// No slugField on this collection — demo docs are tagged via a fixed
// `company` value so clear.ts can find and remove them safely.
const DEMO_COMPANY_MARKER = 'Demo Company Ltd'

export async function seedDemoTestimonials(payload: Payload, photoIds: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const [i, t] of TESTIMONIALS.entries()) {
    const doc = await payload.create({
      collection: 'testimonials',
      locale: 'ja',
      data: {
        quote: 'This is a sample testimonial quote — replace with a real customer or candidate quote.',
        author: {
          name: t.name,
          title: t.title,
          photo: photoIds[i]!,
        },
        company: DEMO_COMPANY_MARKER,
        rating: t.rating,
        active: true,
        aiVisible: true,
      },
    })
    ids.push(doc.id as string)
  }
  return ids
}
