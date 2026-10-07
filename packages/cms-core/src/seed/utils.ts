import type { Field, Payload } from 'payload'

type AnyRec = Record<string, unknown>

/**
 * Payload silently overwrites the shared row storage for `array`/`blocks`
 * fields on every per-locale `update()` call — whichever locale is written
 * last wins for the WHOLE field (block heading, nested array item text, all
 * of it), not just the specific sub-fields a narrower workaround might
 * assume. Sequencing create(ja) -> update(en) -> update(ja) just flips which
 * locale loses; it can't produce a doc where both locales are simultaneously
 * correct.
 *
 * The fix is to never issue more than one write for a given localized
 * array/blocks field: build one data object holding every locale's values
 * up front, keyed by locale at each `localized: true` leaf (Payload's own
 * write-transform layer expects exactly this shape — see
 * `@payloadcms/drizzle/dist/transform/write/traverseFields.js`, which
 * iterates `Object.entries(fieldData)` for localized array/blocks fields),
 * and persist all locales in a single `locale: 'all'` write. `mergeLocales`
 * walks the collection's actual field schema to do this generically — only
 * fields the schema marks `localized: true` get wrapped as
 * `{ [locale]: value }`; everything else (hrefs, media ids, icons, block
 * ids) keeps a single shared value, exactly like Payload itself expects.
 */
export function mergeLocales(fields: Field[], perLocaleData: Record<string, AnyRec>, locales: string[]): AnyRec {
  const result: AnyRec = {}

  for (const field of fields) {
    // Presentational wrapper fields (row, collapsible, unnamed group/tab) have
    // no `name` of their own — their sub-fields belong to the parent's
    // namespace, so recurse without introducing a nesting level.
    if (!('name' in field) || !field.name) {
      if ('fields' in field && Array.isArray(field.fields)) {
        Object.assign(result, mergeLocales(field.fields as Field[], perLocaleData, locales))
      } else if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if ('name' in tab && tab.name) {
            const tabPerLocale: Record<string, AnyRec> = {}
            for (const locale of locales) tabPerLocale[locale] = (perLocaleData[locale]?.[tab.name] as AnyRec) ?? {}
            result[tab.name] = mergeLocales(tab.fields, tabPerLocale, locales)
          } else {
            Object.assign(result, mergeLocales(tab.fields, perLocaleData, locales))
          }
        }
      }
      continue
    }

    const name = field.name
    const perLocaleValues: Record<string, unknown> = {}
    for (const locale of locales) perLocaleValues[locale] = perLocaleData[locale]?.[name]
    if (locales.every((locale) => perLocaleValues[locale] === undefined)) continue

    result[name] = mergeFieldValue(field, perLocaleValues, locales)
  }

  return result
}

function mergeFieldValue(field: Field, perLocaleValues: Record<string, unknown>, locales: string[]): unknown {
  if (field.type === 'array') {
    return mergeRows(perLocaleValues, locales, (row) => mergeLocales(field.fields, row, locales))
  }

  if (field.type === 'blocks') {
    return mergeRows(perLocaleValues, locales, (row, referenceRow, i) => {
      const blockType = (referenceRow as AnyRec)?.['blockType'] as string | undefined
      const blockConfig = field.blocks.find((b) => b.slug === blockType)
      if (!blockConfig) {
        throw new Error(`mergeLocales: unknown blockType "${String(blockType)}" at layout position ${i}`)
      }
      return { ...mergeLocales(blockConfig.fields, row, locales), blockType }
    })
  }

  if (field.type === 'group') {
    const rowPerLocale: Record<string, AnyRec> = {}
    for (const locale of locales) rowPerLocale[locale] = (perLocaleValues[locale] as AnyRec) ?? {}
    return mergeLocales(field.fields, rowPerLocale, locales)
  }

  // Leaf field (text, textarea, number, richText, upload, relationship, select, checkbox, date, ...).
  const firstLocale = locales[0]
  if (firstLocale === undefined) return undefined

  const isLocalized = 'localized' in field && field.localized === true
  if (!isLocalized) {
    // A shared field is often authored on only one locale's data object (e.g.
    // `slug`/`status` on just the primary locale) — that's fine. Only warn
    // when locales that DID supply a value actually disagree.
    const defined = locales
      .map((locale) => [locale, perLocaleValues[locale]] as const)
      .filter(([, value]) => value !== undefined)
    const distinctValues = new Set(defined.map(([, value]) => JSON.stringify(value)))
    if (distinctValues.size > 1) {
      console.warn(
        `mergeLocales: non-localized field "${'name' in field ? field.name : field.type}" has different values across locales — using "${defined[0]?.[0]}"'s value for all locales. Values:`,
        perLocaleValues,
      )
    }
    return defined[0]?.[1]
  }

  const out: Record<string, unknown> = {}
  for (const locale of locales) {
    const value = perLocaleValues[locale]
    if (value !== undefined) out[locale] = value
  }
  return out
}

function pickLongestArray(perLocaleValues: Record<string, unknown>, locales: string[]): unknown[] {
  let longest: unknown[] = []
  for (const locale of locales) {
    const value = perLocaleValues[locale]
    if (Array.isArray(value) && value.length > longest.length) longest = value
  }
  return longest
}

/**
 * Shared row-merging for `array`/`blocks` fields: picks the longest of the
 * per-locale arrays as the index reference (so a locale trailing behind in
 * row count doesn't truncate the others), then builds a per-locale row
 * object at each index and hands it to `mergeRow` to recurse into that
 * row's own field schema.
 */
function mergeRows(
  perLocaleValues: Record<string, unknown>,
  locales: string[],
  mergeRow: (rowPerLocale: Record<string, AnyRec>, referenceRow: unknown, index: number) => unknown,
): unknown[] {
  const rows = pickLongestArray(perLocaleValues, locales)
  return rows.map((referenceRow, i) => {
    const rowPerLocale: Record<string, AnyRec> = {}
    for (const locale of locales) {
      const localeArray = perLocaleValues[locale]
      rowPerLocale[locale] = ((Array.isArray(localeArray) ? localeArray[i] : undefined) as AnyRec) ?? {}
    }
    return mergeRow(rowPerLocale, referenceRow, i)
  })
}

/**
 * Creates a document with fully correct data in every provided locale, in a
 * single write. Use this instead of `create(locale: ja) -> update(locale:
 * en) -> ...` for any collection with localized `array`/`blocks` fields —
 * see `mergeLocales` above for why the sequential-update pattern silently
 * loses data.
 *
 * `perLocaleData` holds one complete data object per locale, each shaped
 * exactly like a normal (single-locale) create payload for this collection.
 * Structural fields (block order, array length, ids, hrefs, media
 * references) must match across locales; only fields the schema marks
 * `localized: true` may actually differ per locale.
 */
export async function createLocalizedDoc<TResult = AnyRec>(
  payload: Payload,
  collection: string,
  perLocaleData: Record<string, AnyRec>,
): Promise<TResult> {
  const locales = Object.keys(perLocaleData)
  const firstLocale = locales[0]
  if (firstLocale === undefined) {
    throw new Error('createLocalizedDoc: perLocaleData must have at least one locale')
  }

  // A single locale can never hit the shared-row-clobbering bug (there's no
  // second write to clobber it) — skip the locale:'all' merge path entirely.
  // This also sidesteps a real Payload limitation: richText's `required`
  // validator inspects `value?.root?.children` directly, before the
  // locale:'all' write-transform unwraps `{ locale: value }` — so a
  // required richText field inside a multi-locale merge fails validation
  // even though the storage layer accepts the shape fine. With only one
  // locale there's nothing to merge, so a plain single-locale create avoids
  // the issue completely.
  const onlyLocaleData = perLocaleData[firstLocale]
  if (locales.length === 1 && onlyLocaleData !== undefined) {
    return (await payload.create({ collection, data: onlyLocaleData, locale: firstLocale })) as TResult
  }

  const collectionConfig = payload.collections[collection]?.config
  if (!collectionConfig) {
    throw new Error(`createLocalizedDoc: unknown collection "${collection}"`)
  }

  const data = mergeLocales(collectionConfig.fields, perLocaleData, locales)

  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await (payload as any).create({ collection, data, locale: 'all' })) as TResult
}

/**
 * Updates an EXISTING document with fully correct data in every provided
 * locale, in a single write — the update-path counterpart to
 * `createLocalizedDoc` above, for a doc that was already created (e.g. by
 * `upsertBySlug`) and now needs its real localized `array`/`blocks` content
 * filled in. Looks the doc up by `slug`, then issues one
 * `payload.update({ id, data, locale: 'all' })` built the same
 * locale-merged way `createLocalizedDoc` builds its `create()` payload, so
 * it's subject to the exact same single-write guarantee (see the comment
 * above `mergeLocales`). Throws if no doc with that slug exists — this is
 * an update path, not an upsert.
 */
export async function updateLocalizedDoc<TResult = AnyRec>(
  payload: Payload,
  collection: string,
  slug: string,
  perLocaleData: Record<string, AnyRec>,
): Promise<TResult> {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const doc = existing.docs[0]
  if (!doc) {
    throw new Error(`updateLocalizedDoc: no "${collection}" doc with slug "${slug}" exists to update`)
  }

  const locales = Object.keys(perLocaleData)
  const firstLocale = locales[0]
  if (firstLocale === undefined) {
    throw new Error('updateLocalizedDoc: perLocaleData must have at least one locale')
  }

  // Single-locale case can't hit the shared-row-clobbering bug — see
  // createLocalizedDoc's comment for why this path is safe to skip the merge.
  const onlyLocaleData = perLocaleData[firstLocale]
  if (locales.length === 1 && onlyLocaleData !== undefined) {
    return (await payload.update({
      collection,
      id: doc['id'] as number | string,
      data: onlyLocaleData,
      locale: firstLocale,
    })) as TResult
  }

  const collectionConfig = payload.collections[collection]?.config
  if (!collectionConfig) {
    throw new Error(`updateLocalizedDoc: unknown collection "${collection}"`)
  }

  const data = mergeLocales(collectionConfig.fields, perLocaleData, locales)

  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await (payload as any).update({
    collection,
    id: doc['id'] as number | string,
    data,
    locale: 'all',
  })) as TResult
}

export async function upsertBySlug<T extends Record<string, unknown>>(
  payload: Payload,
  collection: string,
  slug: string,
  data: T,
): Promise<void> {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    return
  }

  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (payload as any).create({ collection, data: { ...data, slug }, locale: 'all' })
}

export async function upsertGlobal<T extends Record<string, unknown>>(
  payload: Payload,
  slug: string,
  data: T,
): Promise<void> {
  await payload.updateGlobal({ slug, data })
}
