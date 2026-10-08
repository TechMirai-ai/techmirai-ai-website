// Industry pages are ordinary documents in the generic `pages` collection,
// routed under /solutions/[slug] instead of the top-level catch-all — same
// pattern as about-slugs.ts. This is the single allowlist the route uses.
export const SOLUTIONS_PAGE_SLUGS = ['clinic', 'beauty', 'automobile', 'hotel'] as const
