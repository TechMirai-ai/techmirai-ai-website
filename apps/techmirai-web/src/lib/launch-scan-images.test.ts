import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkB7Images } from '../../../../scripts/launch-scan-rules.mjs'

interface Hit {
  ruleId: string
  snippet: string
  note: string
}

describe('checkB7Images', () => {
  it('flags an image with no alt attribute', () => {
    const hits: Hit[] = checkB7Images([{ src: '/media/a.png', alt: null }])
    assert.equal(hits.length, 1)
    assert.match(hits[0]!.note, /missing alt/)
  })

  it('accepts an empty alt as a decorative image', () => {
    assert.deepEqual(checkB7Images([{ src: '/media/a.png', alt: '' }]), [])
  })

  it('flags a placeholder image, including through the Next image URL', () => {
    const hits: Hit[] = checkB7Images([
      { src: '/_next/image?url=%2Fmedia%2Fplaceholder-team-group.png&w=1080&q=75', alt: 'Team' },
    ])
    assert.equal(hits.length, 1)
    assert.match(hits[0]!.note, /placeholder image/)
  })

  it('flags the clinic template hero placeholder even with an empty alt', () => {
    const hits: Hit[] = checkB7Images([{ src: '/hero-placeholder.jpg', alt: '' }])
    assert.equal(hits.length, 1)
    assert.match(hits[0]!.note, /placeholder image/)
  })

  it('ignores inline data: images such as the generated QR code', () => {
    assert.deepEqual(checkB7Images([{ src: 'data:image/png;base64,placeholderAAAA', alt: '' }]), [])
  })

  it('does not flag a real image with alt text', () => {
    assert.deepEqual(checkB7Images([{ src: '/media/office.jpg', alt: 'Our office' }]), [])
  })
})
