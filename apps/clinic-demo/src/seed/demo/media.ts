import type { Payload } from 'payload'
import { createPlaceholderPng, paletteColor } from './lib/placeholder-image'
import { createPlaceholderPdf } from './lib/placeholder-pdf'

export interface DemoMediaIds {
  team: string[]
  doctors: string[]
  news: string[]
  blog: string[]
  services: string[]
  testimonials: string[]
  downloads: string[]
  heroBg: string
  companyPhoto: string
  aboutHeroBg: string
  aboutSplit: string[]
  galleryBlock: string[]
  gallery: string[]
  events: string[]
}

export interface SeedDemoMediaOptions {
  hasGallery: boolean
  hasEvents: boolean
}

async function uploadPlaceholderImage(
  payload: Payload,
  name: string,
  width: number,
  height: number,
  colorIndex: number,
  alt: string,
): Promise<string> {
  const buffer = createPlaceholderPng(width, height, paletteColor(colorIndex), paletteColor(colorIndex + 1))
  const doc = await payload.create({
    collection: 'media',
    locale: 'ja',
    data: { alt },
    file: {
      data: buffer,
      mimetype: 'image/png',
      name: `${name}.png`,
      size: buffer.length,
    },
  })
  return doc.id as string
}

async function uploadPlaceholderPdf(
  payload: Payload,
  name: string,
  title: string,
  note: string,
): Promise<string> {
  const buffer = createPlaceholderPdf(title, note)
  const doc = await payload.create({
    collection: 'media',
    locale: 'ja',
    data: { alt: title },
    file: {
      data: buffer,
      mimetype: 'application/pdf',
      name: `${name}.pdf`,
      size: buffer.length,
    },
  })
  return doc.id as string
}

/**
 * Generates every placeholder media asset the demo seed needs, using an
 * in-process PNG/PDF encoder (see lib/placeholder-image.ts, lib/placeholder-pdf.ts)
 * so the seed never depends on network access or ships real client photography.
 */
export async function seedDemoMedia(payload: Payload, options: SeedDemoMediaOptions): Promise<DemoMediaIds> {
  payload.logger.info('🖼️  Generating placeholder media...')

  const team: string[] = []
  for (let i = 0; i < 6; i++) {
    team.push(await uploadPlaceholderImage(payload, `demo-team-${String(i + 1).padStart(2, '0')}`, 400, 400, i, `Demo team member ${i + 1} placeholder photo`))
  }

  const doctors: string[] = []
  for (let i = 0; i < 5; i++) {
    doctors.push(await uploadPlaceholderImage(payload, `demo-doctor-${String(i + 1).padStart(2, '0')}`, 400, 400, i + 1, `Demo doctor ${i + 1} placeholder photo`))
  }

  const news: string[] = []
  for (let i = 0; i < 5; i++) {
    news.push(await uploadPlaceholderImage(payload, `demo-news-${String(i + 1).padStart(2, '0')}`, 800, 600, i + 2, `Demo news thumbnail ${i + 1}`))
  }

  const blog: string[] = []
  for (let i = 0; i < 5; i++) {
    blog.push(await uploadPlaceholderImage(payload, `demo-blog-${String(i + 1).padStart(2, '0')}`, 800, 600, i + 3, `Demo blog featured image ${i + 1}`))
  }

  const services: string[] = []
  for (let i = 0; i < 6; i++) {
    services.push(await uploadPlaceholderImage(payload, `demo-service-${String(i + 1).padStart(2, '0')}`, 800, 600, i + 1, `Demo department thumbnail ${i + 1}`))
  }

  const testimonials: string[] = []
  for (let i = 0; i < 6; i++) {
    testimonials.push(await uploadPlaceholderImage(payload, `demo-testimonial-${String(i + 1).padStart(2, '0')}`, 400, 400, i + 4, `Demo testimonial author photo ${i + 1}`))
  }

  const downloads: string[] = []
  const downloadTitles = [
    'Demo Service Brochure',
    'Demo Hiring Guide',
    'Demo Onboarding Handbook',
    'Demo Cost Calculator',
    'Demo Compliance Checklist',
  ]
  for (const [i, title] of downloadTitles.entries()) {
    downloads.push(
      await uploadPlaceholderPdf(
        payload,
        `demo-download-${String(i + 1).padStart(2, '0')}`,
        title,
        'This is a sample downloadable file — replace with a real document.',
      ),
    )
  }

  const heroBg = await uploadPlaceholderImage(payload, 'demo-hero-bg', 1600, 900, 0, 'Demo homepage hero background')
  const companyPhoto = await uploadPlaceholderImage(payload, 'demo-company-photo', 900, 700, 5, 'Demo company office placeholder photo')
  const aboutHeroBg = await uploadPlaceholderImage(payload, 'demo-about-hero-bg', 1600, 900, 6, 'Demo about page hero background')

  const aboutSplit: string[] = []
  for (let i = 0; i < 2; i++) {
    aboutSplit.push(await uploadPlaceholderImage(payload, `demo-about-split-${String(i + 1).padStart(2, '0')}`, 900, 700, i + 1, `Demo about section image ${i + 1}`))
  }

  const galleryBlock: string[] = []
  for (let i = 0; i < 6; i++) {
    galleryBlock.push(await uploadPlaceholderImage(payload, `demo-gallery-block-${String(i + 1).padStart(2, '0')}`, 900, 700, i, `Demo gallery photo ${i + 1}`))
  }

  const gallery: string[] = []
  if (options.hasGallery) {
    for (let i = 0; i < 8; i++) {
      gallery.push(await uploadPlaceholderImage(payload, `demo-gallery-${String(i + 1).padStart(2, '0')}`, 1200, 800, i, `Demo gallery collection photo ${i + 1}`))
    }
  }

  const events: string[] = []
  if (options.hasEvents) {
    for (let i = 0; i < 5; i++) {
      events.push(await uploadPlaceholderImage(payload, `demo-event-${String(i + 1).padStart(2, '0')}`, 800, 600, i + 2, `Demo event thumbnail ${i + 1}`))
    }
  }

  payload.logger.info('🖼️  Placeholder media generated.\n')

  return {
    team,
    doctors,
    news,
    blog,
    services,
    testimonials,
    downloads,
    heroBg,
    companyPhoto,
    aboutHeroBg,
    aboutSplit,
    galleryBlock,
    gallery,
    events,
  }
}
