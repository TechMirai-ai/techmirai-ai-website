# O2 code review

**Step:** Pack-4 / O2 · **Date:** 2026-10-19
**Scope (as instructed):** commit `fface4f` ("fix(website): clean up legacy route metadata and blog content") plus the uncommitted O2 diff. Nothing else was reviewed.
**Method:** local review following the `/code-review` checklist (security, quality, best practice; correctness, types, patterns, completeness, maintainability). Every changed file was read in full. No pull request or GitHub step was used.
**Decision: APPROVE with comments.** 0 critical, 0 high, 2 medium, 3 low.

## Files reviewed

| Change | File |
|---|---|
| `fface4f` | `blog/page.tsx`, `company/page.tsx`, `contact/page.tsx`, `news/page.tsx`, `news/[slug]/page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx`, `team/page.tsx`, `team/[slug]/page.tsx` (all under `apps/techmirai-web/src/app/(frontend)/[locale]/`), `apps/techmirai-web/src/seed/case-studies.ts` |
| O2, uncommitted | `apps/techmirai-web/scripts/a11y-check.ts`, `apps/techmirai-web/src/app/(frontend)/[locale]/[slug]/page.tsx`, `package.json` |

## Findings

### Critical
None. No hardcoded secret, no injection or XSS path, no input handling added. `a11y-check.ts` takes only `BASE_URL` from the environment and sends GET requests.

### High
None.

### Medium
1. **Hardcoded slug list in the catch-all fix** (`[locale]/[slug]/page.tsx:18`, used at `:44`). `DEDICATED_ROUTE_SLUGS` lists only `assessment`. If another dedicated route later shares a slug with a `pages` document, the same empty-page production bug returns, and dev will not show it. The change is also not covered by an automated test: it sits in a route file that depends on Payload, and the regression is only visible in a production build. The existing E2E check (`seo.spec.ts`: one `<h1>`, Spec title) would catch it when run against a production build. **Not changed** (a more general guard, such as deriving the list from the route folders, is a larger change).
2. **`a11y-check.ts` is outside the type check.** `apps/techmirai-web/tsconfig.json` does not include `scripts/`, so `pnpm typecheck` never compiles it. This is the same for the other scripts (pre-existing). It runs correctly under `tsx` (46 routes), but a type error there would not be caught by CI. Not changed.

### Low
1. `a11y-check.ts:41,53,69,93,97`: the `results` array and `RouteResult` fields (`url`, `status`, `blocking`, `nonBlocking`) are filled but only `results.length` is ever read. Harmless; could become a plain counter.
2. `a11y-check.ts`: one browser page is reused for all routes and `process.exit(1)` in the final `catch` skips `browser.close()` on an unexpected crash. Acceptable for a CLI script.
3. `fface4f`, `blog/page.tsx`: the empty-state message under the heading repeats the intro text, because `descriptions` feeds both the hero body and the "no posts" message. Cosmetic, only visible when there are no posts.

## Checked and found correct
- **Copy accuracy (`fface4f`):** the Japanese and English blog intro, the H1, the end-of-post CTA text and the global CTA button labels match Spec §15.1 / §4 character for character; the Contact button label uses the Spec nav wording ("About" / "会社紹介") and links to `/about`.
- **Metadata (`fface4f`):** `robots: { index: false, follow: false }` is present in `company`, `services`, `services/[slug]` and `news` metadata and as static `metadata` exports in `news/[slug]`, `team` and `team/[slug]`; the existing feature-flag `notFound()` gates are untouched; rendered meta tags confirmed in both locales. `services/page.tsx` no longer carries clinic wording or invented copy.
- **`case-studies.ts`:** the stray `\u0096` is removed; the string now equals Spec §13 exactly.
- **Catch-all fix (O2):** the filter narrows `doc.slug` correctly (typecheck passes); routing still sends `/assessment` to the static route; build output confirms the dedicated route now owns both locale paths.
- **Rules:** no database change, reseed, test change or deletion, or secret handling in either scope.

## Validation (run on the final tree)

| Check | Result |
|---|---|
| `pnpm typecheck` | Pass (3/3) |
| `techmirai-web` tests | 48/48 pass |
| `cms-core` / `reception-engine` tests | 1,012/1,012 and 47/47 pass (no files changed in those packages since the run) |
| `pnpm build` | Pass, 105/105 pages |
| `pnpm a11y` (46 routes) | 0 serious/critical, exit 0 |
| `seo.spec.ts` (alone) | 38 pass; 14 fail on the soft heading-order assertion only (known, see `O2-ACCESSIBILITY.md`) |

## Out of scope (not fixed here; see `docs/FINDINGS.md`)
- `blog/[slug]/page.tsx` lines 102-107 still carry the recruitment CTA ("Stay informed on Japan's employment landscape" / "Talk to Our Experts").
- `/contact` is still clinic-flavoured beyond the button changed in `fface4f` (FINDINGS J1).
- Nine static preflight hits remain (`site.config.ts` social URLs and recipient; four engine files). O1 scope is closed.
