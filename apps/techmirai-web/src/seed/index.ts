/**
 * `pnpm seed` — the slot for a real client's real content seed.
 *
 * This file intentionally has no content seeding logic yet: real client
 * content is specific to each deployment and doesn't belong in the shared
 * template. Structure the client's content into JSON matching the
 * collection shapes in packages/cms-core/src/verticals/clinic/collections/,
 * then write real seeding logic here following the pattern in
 * src/seed/demo/index.ts (see README.md's "Populating content" section).
 *
 * For placeholder/demo content instead, run `pnpm seed:demo`.
 */
console.log(
  [
    'No real-content seed script has been written for this client yet.',
    '',
    'Options:',
    '  - Run `pnpm seed:demo` for placeholder demo content.',
    '  - Write real seeding logic in apps/techmirai-web/src/seed/index.ts,',
    '    following the pattern in src/seed/demo/index.ts. See README.md\'s',
    '    "Populating content" section.',
  ].join('\n'),
)
process.exit(1)
