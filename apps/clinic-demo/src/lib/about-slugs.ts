// About sub-pages are ordinary documents in the generic `pages` collection,
// routed under /about/[slug] instead of the top-level catch-all — this is
// the single allowlist both that route and the search index build hrefs from.
export const ABOUT_PAGE_SLUGS = [
  'message-from-the-ceo',
  'organization-overview',
  'business-contents',
  'history',
] as const
