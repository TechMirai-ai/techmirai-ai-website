import { LEGAL_PAGE_META, PAGE_META, type LocalizedMeta } from './page-meta'

// Pack-4/L2: shared by the /og share-image route and build-metadata.ts, so a
// page only ever points at an image the route will actually draw.

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const
export const CASE_STUDY_PATH = '/case-studies/sadiatec'

/** The Spec §17.1 (or legal-page) row for a locale-less path, if it has one. */
export function metaRowFor(path: string): LocalizedMeta | undefined {
  return PAGE_META[path] ?? LEGAL_PAGE_META[path]
}

/** Relative URL of the generated share image, or undefined for pages without a row. */
export function ogImageUrl(path: string, locale: string): string | undefined {
  if (!metaRowFor(path)) return undefined
  return `/og?${new URLSearchParams({ path, locale }).toString()}`
}

/** Seeded 1200×630 placeholder share images (`og-<slug>.png`, PLACEHOLDER-REGISTER F3-*). */
export function isSeededPlaceholderImage(filename: unknown): boolean {
  return typeof filename === 'string' && /^og-[a-z0-9-]+\.png$/.test(filename)
}
