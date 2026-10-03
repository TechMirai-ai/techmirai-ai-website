import { describe, it, expect, vi } from 'vitest'
import type { Field, Payload } from 'payload'
import { mergeLocales, createLocalizedDoc } from '../utils'

describe('mergeLocales', () => {
  it('wraps a localized leaf field as { locale: value } and keeps a non-localized leaf shared', () => {
    // Arrange
    const fields: Field[] = [
      { name: 'headline', type: 'text', localized: true },
      { name: 'href', type: 'text' },
    ]
    const perLocaleData = {
      ja: { headline: 'こんにちは', href: '/contact' },
      en: { headline: 'Hello', href: '/contact' },
    }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en'])

    // Assert
    expect(result['headline']).toEqual({ ja: 'こんにちは', en: 'Hello' })
    expect(result['href']).toBe('/contact')
  })

  it('merges an array field row-by-row, recursing into each row with the array field schema', () => {
    // Arrange
    const fields: Field[] = [
      {
        name: 'items',
        type: 'array',
        fields: [
          { name: 'label', type: 'text', localized: true },
          { name: 'icon', type: 'text' },
        ],
      },
    ]
    const perLocaleData = {
      ja: { items: [{ label: '一つ目', icon: 'star' }, { label: '二つ目', icon: 'check' }] },
      en: { items: [{ label: 'First', icon: 'star' }, { label: 'Second', icon: 'check' }] },
    }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en']) as { items: Array<Record<string, unknown>> }

    // Assert
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({ label: { ja: '一つ目', en: 'First' }, icon: 'star' })
    expect(result.items[1]).toEqual({ label: { ja: '二つ目', en: 'Second' }, icon: 'check' })
  })

  it('merges a blocks field, matching each locale row by position and preserving blockType', () => {
    // Arrange
    const fields: Field[] = [
      {
        name: 'layout',
        type: 'blocks',
        blocks: [
          { slug: 'hero', fields: [{ name: 'headline', type: 'text', localized: true }] },
        ],
      },
    ]
    const perLocaleData = {
      ja: { layout: [{ blockType: 'hero', headline: 'こんにちは' }] },
      en: { layout: [{ blockType: 'hero', headline: 'Hello' }] },
    }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en']) as { layout: Array<Record<string, unknown>> }

    // Assert
    expect(result.layout[0]).toEqual({ blockType: 'hero', headline: { ja: 'こんにちは', en: 'Hello' } })
  })

  it('throws when a blocks row references a blockType not present in the field schema', () => {
    // Arrange
    const fields: Field[] = [
      { name: 'layout', type: 'blocks', blocks: [{ slug: 'hero', fields: [] }] },
    ]
    const perLocaleData = {
      ja: { layout: [{ blockType: 'unknown-block' }] },
      en: { layout: [{ blockType: 'unknown-block' }] },
    }

    // Act & Assert
    expect(() => mergeLocales(fields, perLocaleData, ['ja', 'en'])).toThrow(/unknown blockType/)
  })

  it('recurses into a group field without introducing an extra nesting level', () => {
    // Arrange
    const fields: Field[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [{ name: 'title', type: 'text', localized: true }],
      },
    ]
    const perLocaleData = {
      ja: { meta: { title: 'ホーム' } },
      en: { meta: { title: 'Home' } },
    }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en']) as { meta: Record<string, unknown> }

    // Assert
    expect(result.meta).toEqual({ title: { ja: 'ホーム', en: 'Home' } })
  })

  it('flattens an unnamed presentational row field into the parent namespace', () => {
    // Arrange
    const fields: Field[] = [
      { type: 'row', fields: [{ name: 'label', type: 'text', localized: true }] },
    ]
    const perLocaleData = { ja: { label: 'ラベル' }, en: { label: 'Label' } }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en'])

    // Assert
    expect(result['label']).toEqual({ ja: 'ラベル', en: 'Label' })
  })

  it('nests a named tab under its own key but flattens an unnamed tab', () => {
    // Arrange
    const fields: Field[] = [
      {
        type: 'tabs',
        tabs: [
          { name: 'seo', fields: [{ name: 'title', type: 'text', localized: true }] },
          { label: 'Flat Tab', fields: [{ name: 'flat', type: 'text', localized: true }] },
        ],
      },
    ]
    const perLocaleData = {
      ja: { seo: { title: 'タイトル' }, flat: 'フラット' },
      en: { seo: { title: 'Title' }, flat: 'Flat' },
    }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en']) as { seo: Record<string, unknown>; flat: unknown }

    // Assert
    expect(result.seo).toEqual({ title: { ja: 'タイトル', en: 'Title' } })
    expect(result['flat']).toEqual({ ja: 'フラット', en: 'Flat' })
  })

  it('warns and picks the first defined value when a non-localized field disagrees across locales', () => {
    // Arrange
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const fields: Field[] = [{ name: 'href', type: 'text' }]
    const perLocaleData = { ja: { href: '/ja-only' }, en: { href: '/en-only' } }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en'])

    // Assert
    expect(result['href']).toBe('/ja-only')
    expect(warnSpy).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })

  it('does not warn when a shared field is only supplied by one locale (e.g. slug on the primary locale)', () => {
    // Arrange
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const fields: Field[] = [{ name: 'slug', type: 'text' }]
    const perLocaleData = { ja: { slug: 'home' }, en: {} }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en'])

    // Assert
    expect(result['slug']).toBe('home')
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('preserves an intentionally-non-empty value per locale (e.g. a placeholder space) rather than dropping it', () => {
    // Arrange
    const fields: Field[] = [{ name: 'suffix', type: 'text', localized: true }]
    const perLocaleData = { ja: { suffix: '名' }, en: { suffix: ' ' } }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en'])

    // Assert
    expect(result['suffix']).toEqual({ ja: '名', en: ' ' })
  })

  it('pads a locale whose array is shorter than another locale with empty rows instead of truncating', () => {
    // Arrange
    const fields: Field[] = [
      {
        name: 'items',
        type: 'array',
        fields: [{ name: 'label', type: 'text', localized: true }],
      },
    ]
    const perLocaleData = {
      ja: { items: [{ label: '一' }, { label: '二' }] },
      en: { items: [{ label: 'One' }] },
    }

    // Act
    const result = mergeLocales(fields, perLocaleData, ['ja', 'en']) as { items: Array<Record<string, unknown>> }

    // Assert
    expect(result.items).toHaveLength(2)
    expect(result.items[1]).toEqual({ label: { ja: '二' } })
  })
})

describe('createLocalizedDoc', () => {
  it('takes the single-locale fast path and calls payload.create with a plain (unwrapped) locale write', async () => {
    // Arrange
    const create = vi.fn().mockResolvedValue({ id: '1' })
    const payload = { create } as unknown as Payload
    const data = { title: 'Demo About', slug: 'demo-about' }

    // Act
    await createLocalizedDoc(payload, 'pages', { ja: data })

    // Assert
    expect(create).toHaveBeenCalledWith({ collection: 'pages', data, locale: 'ja' })
  })

  it('merges via the collection schema and writes once with locale: "all" for multiple locales', async () => {
    // Arrange
    const create = vi.fn().mockResolvedValue({ id: '1' })
    const fields: Field[] = [{ name: 'title', type: 'text', localized: true }]
    const payload = {
      create,
      collections: { pages: { config: { fields } } },
    } as unknown as Payload

    // Act
    await createLocalizedDoc(payload, 'pages', { ja: { title: 'ホーム' }, en: { title: 'Home' } })

    // Assert
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({
      collection: 'pages',
      data: { title: { ja: 'ホーム', en: 'Home' } },
      locale: 'all',
    })
  })

  it('throws when the target collection is not registered on the payload instance', async () => {
    // Arrange
    const payload = { create: vi.fn(), collections: {} } as unknown as Payload

    // Act & Assert
    await expect(createLocalizedDoc(payload, 'missing-collection', { ja: {}, en: {} })).rejects.toThrow(
      /unknown collection/,
    )
  })
})
