import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { IMAGE_SLOTS, JA_TODO } from './image-slots'

const REPO_ROOT = join(__dirname, '..', '..', '..', '..')

describe('IMAGE_SLOTS (Spec §19)', () => {
  it('has unique ids', () => {
    const ids = IMAGE_SLOTS.map((slot) => slot.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('gives every existing image non-empty EN and JA alt text, or marks it decorative', () => {
    for (const slot of IMAGE_SLOTS.filter((s) => s.status !== 'not-built')) {
      if (slot.alt === 'decorative') continue
      assert.ok(slot.alt.en.trim(), `${slot.id}: EN alt missing`)
      assert.ok(slot.alt.ja.trim(), `${slot.id}: JA alt missing`)
    }
  })

  it('allows the [JA TODO] marker only with a register id', () => {
    for (const slot of IMAGE_SLOTS) {
      if (slot.alt === 'decorative' || slot.alt.ja !== JA_TODO) continue
      assert.match(slot.registerId ?? '', /^[A-Z][0-9]-[0-9]{2}$/, `${slot.id}: [JA TODO] needs a register id`)
    }
  })

  it('gives every slot not built yet a register id and a supplier', () => {
    for (const slot of IMAGE_SLOTS.filter((s) => s.status === 'not-built')) {
      assert.ok(slot.registerId, `${slot.id}: register id missing`)
      assert.ok(slot.supplier.trim(), `${slot.id}: supplier missing`)
    }
  })

  it('uses the Spec p.113 alt text word for word', () => {
    const spec = readFileSync(
      join(REPO_ROOT, 'docs', '_inputs', 'TechMirai Website — Full Content Spec (EN JA).md'),
      'utf8',
    )
    // The Spec escapes literal brackets as \[ \].
    const escape = (text: string) => text.replace(/\[/g, '\\[').replace(/\]/g, '\\]')
    for (const id of ['hero-phone-mockup', 'portrait-jamal', 'portrait-haruka', 'layers-diagram']) {
      const slot = IMAGE_SLOTS.find((s) => s.id === id)
      assert.ok(slot, `${id}: slot missing`)
      assert.notEqual(slot.alt, 'decorative', `${id}: must have alt text`)
      if (slot.alt === 'decorative') continue
      assert.ok(spec.includes(escape(slot.alt.en)), `${id}: EN alt differs from the Spec`)
      assert.ok(spec.includes(escape(slot.alt.ja)), `${id}: JA alt differs from the Spec`)
    }
  })

  it('is fully listed in docs/IMAGE-SLOTS.md', () => {
    const doc = readFileSync(join(REPO_ROOT, 'docs', 'IMAGE-SLOTS.md'), 'utf8')
    for (const slot of IMAGE_SLOTS) {
      assert.ok(doc.includes(`\`${slot.id}\``), `${slot.id}: not in docs/IMAGE-SLOTS.md`)
    }
  })
})
