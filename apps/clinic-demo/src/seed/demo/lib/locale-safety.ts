import type { Field } from 'payload'

/**
 * Asserts a collection has no localized `array`/`blocks` field.
 *
 * Payload keeps one shared row store for a localized array/blocks field, so a
 * sequential `update(locale: ja)` → `update(locale: en)` pair lets the last
 * write clobber every other locale — the bug that createLocalizedDoc()
 * (@techmirai/cms-core/seed) exists to avoid by writing all locales at once.
 *
 * That single-write escape hatch is only available on `create()`:
 * `payload.update()` silently ignores `locale: 'all'` and writes nothing. So a
 * seed that UPSERTS onto an existing doc has no choice but to write one locale
 * at a time — which is safe only while every localized field on the collection
 * is a plain leaf (text, textarea, richText, number, ...).
 *
 * Call this before any per-locale update loop, so that adding a localized
 * array to the collection later fails loudly here instead of quietly dropping
 * a locale's content the way the original bug did.
 */
export function assertNoLocalizedRowFields(fields: Field[], path: string): void {
  for (const field of fields) {
    const name = 'name' in field && field.name ? `${path}.${field.name}` : path
    if ((field.type === 'array' || field.type === 'blocks') && 'localized' in field && field.localized) {
      throw new Error(
        `${path}: ${name} is a localized ${field.type} field. Sequential per-locale updates would clobber ` +
          'it — this seed needs a single locale:\'all\' write instead (see @techmirai/cms-core/seed).',
      )
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      assertNoLocalizedRowFields(field.fields as Field[], name)
    }
  }
}
