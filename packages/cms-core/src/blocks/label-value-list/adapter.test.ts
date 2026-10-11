import { describe, it, expect } from 'vitest'
import { adaptLabelValueListBlock } from './adapter'

describe('adaptLabelValueListBlock', () => {
  it('maps label/detail rows and ignores unrelated keys like founderGated', () => {
    // Arrange — Pack-3/I2: founderGated is filtered out of `rows` by the page
    // renderer before the adapter ever sees it (see [locale]/[slug]/page.tsx),
    // but the adapter must not choke if a row still carries the key.
    const raw = {
      heading: 'Company profile',
      rows: [
        { label: 'Representative', detail: 'Jamal Shah', founderGated: true },
        { label: 'Trade name', detail: 'TechMirai' },
      ],
    }

    // Act
    const result = adaptLabelValueListBlock(raw)

    // Assert
    expect(result.rows).toEqual([
      { label: 'Representative', detail: 'Jamal Shah' },
      { label: 'Trade name', detail: 'TechMirai' },
    ])
  })

  it('drops rows with no label', () => {
    // Arrange
    const raw = { rows: [{ label: '', detail: 'orphaned detail' }, { label: 'Kept', detail: 'x' }] }

    // Act
    const result = adaptLabelValueListBlock(raw)

    // Assert
    expect(result.rows).toEqual([{ label: 'Kept', detail: 'x' }])
  })
})
