import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPageMetadata, metadataFromPageDoc } from './build-metadata'
import { CASE_STUDY_PATH, OG_IMAGE_SIZE, isSeededPlaceholderImage, metaRowFor, ogImageUrl } from './og-image'

// Pack-4/L2 share-image tests. Run with `pnpm --filter techmirai-web test`.

type OgImage = { url: string; width?: number; height?: number; alt?: string } | string

function ogImages(m: ReturnType<typeof buildPageMetadata>): OgImage[] | undefined {
  return (m.openGraph as { images?: OgImage[] } | null | undefined)?.images
}
function twitter(m: ReturnType<typeof buildPageMetadata>): Record<string, unknown> {
  return (m.twitter ?? {}) as Record<string, unknown>
}

test('ogImageUrl: only pages with a Spec row get an image URL, encoded per locale', () => {
  assert.equal(ogImageUrl('', 'ja'), '/og?path=&locale=ja')
  assert.equal(ogImageUrl('/pricing', 'en'), '/og?path=%2Fpricing&locale=en')
  assert.equal(ogImageUrl('/privacy', 'ja'), '/og?path=%2Fprivacy&locale=ja')
  assert.equal(ogImageUrl(CASE_STUDY_PATH, 'en'), '/og?path=%2Fcase-studies%2Fsadiatec&locale=en')
  assert.equal(ogImageUrl('/thanks', 'en'), undefined)
  assert.equal(ogImageUrl('/blog/some-post', 'en'), undefined)
  assert.equal(metaRowFor('/nope'), undefined)
})

test('isSeededPlaceholderImage: matches only the seeded og-<slug>.png files', () => {
  for (const name of ['og-home.png', 'og-how-it-works.png', 'og-legal-notice.png']) {
    assert.equal(isSeededPlaceholderImage(name), true, name)
  }
  for (const name of ['team-photo.png', 'og-home.jpg', 'my-og-home.png', 'og-Home.png', undefined, null, 42]) {
    assert.equal(isSeededPlaceholderImage(name), false, String(name))
  }
})

test('buildPageMetadata: default share image is the generated /og image, 1200×630, with alt', () => {
  const m = buildPageMetadata({ locale: 'ja', path: '/pricing', title: 'T', description: 'D' })
  assert.deepEqual(ogImages(m), [{ url: '/og?path=%2Fpricing&locale=ja', ...OG_IMAGE_SIZE, alt: 'T' }])
  assert.deepEqual(twitter(m), {
    card: 'summary_large_image',
    title: 'T',
    description: 'D',
    images: ['/og?path=%2Fpricing&locale=ja'],
  })
})

test('buildPageMetadata: an editor-chosen image wins over the generated one', () => {
  const m = buildPageMetadata({ locale: 'en', path: '/pricing', title: 'T', image: '/api/media/file/real.png' })
  assert.deepEqual(ogImages(m), ['/api/media/file/real.png'])
  assert.deepEqual(twitter(m)['images'], ['/api/media/file/real.png'])
})

test('buildPageMetadata: pages without a Spec row get no image but keep the large card', () => {
  const m = buildPageMetadata({ locale: 'en', path: '/thanks', title: 'T', noindex: true })
  assert.equal(ogImages(m), undefined)
  assert.equal(twitter(m)['card'], 'summary_large_image')
  assert.equal('images' in twitter(m), false)
})

test('metadataFromPageDoc: seeded og-*.png placeholder is replaced by the generated image', () => {
  const doc = {
    title: 'Pricing',
    meta: { title: 'Meta T', image: { url: '/api/media/file/og-pricing.png', filename: 'og-pricing.png' } },
  }
  const m = metadataFromPageDoc(doc, 'en', '/pricing')
  assert.deepEqual(ogImages(m), [{ url: '/og?path=%2Fpricing&locale=en', ...OG_IMAGE_SIZE, alt: 'Meta T' }])
  assert.deepEqual(twitter(m)['images'], ['/og?path=%2Fpricing&locale=en'])
})

test('metadataFromPageDoc: a real uploaded image is kept', () => {
  const doc = {
    title: 'Pricing',
    meta: { image: { url: '/api/media/file/pricing-hero.png', filename: 'pricing-hero.png' } },
  }
  const m = metadataFromPageDoc(doc, 'ja', '/pricing')
  assert.deepEqual(ogImages(m), ['/api/media/file/pricing-hero.png'])
})
