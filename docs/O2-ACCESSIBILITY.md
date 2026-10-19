# O2 accessibility report

**Step:** Pack-4 / O2 (tests, accessibility, build) · **Date:** 2026-10-19 · **Branch:** `main`
**Result:** no serious or critical violation (WCAG 2.1 A/AA, axe-core) on any of the 46 checked routes. Several limits below mean this is **not** a full accessibility sign-off.

## What was run

| Item | Value |
|---|---|
| Tool | axe-core via Playwright (`@axe-core/playwright`), Chromium |
| Command | `pnpm a11y` (root alias for `pnpm --filter techmirai-web a11y`; script `apps/techmirai-web/scripts/a11y-check.ts`) |
| Target | `next start` on a fresh `next build` (production mode, `localhost:3000`), `SITE_ENV` unset, this repo's development database |
| Rule tags | `wcag2a`, `wcag2aa`, `wcag21aa` |
| Pass rule | no `serious` or `critical` violation, and every route answers 200. `moderate` and `minor` are printed but do not fail the run. |
| Route source | Spec §4 / §17.1 metadata: `PAGE_META` and `LEGAL_PAGE_META` in `src/lib/seo/page-meta.ts` (the sitemap's source), plus `/booking` and `/thanks`. Japanese is unprefixed, English is under `/en`. |
| Routes | 23 pages x 2 locales = **46** |

Routes checked: `/`, `/ai-reception`, `/solutions`, `/solutions/clinic`, `/solutions/beauty`, `/solutions/automobile`, `/solutions/hotel`, `/how-it-works`, `/integrations`, `/pricing`, `/security`, `/about`, `/technology`, `/assessment`, `/case-studies/sadiatec`, `/faq`, `/blog`, `/contact`, `/privacy`, `/terms`, `/legal-notice`, `/booking`, `/thanks`, each also under `/en`.

## Results

| Run | Outcome |
|---|---|
| Final (after the catch-all fix below) | exit 0. 46 routes checked, **0** blocking, **0** non-blocking, **0** route errors. |
| First run (before the fix) | Also exit 0 with 0 violations, **but invalid for `/assessment` and `/en/assessment`**: the production build served those two URLs from the generic catch-all with an empty `<main>`, so axe had nothing to test. Superseded by the final run. |

`/assessment` and `/en/assessment` in the final run: both pass, each with one `<h1>`, a real title (`無料AIホームページ診断｜TechMirai`, `Free AI Website Assessment — TechMirai`) and the form content present.

### The `/assessment` defect found on the way (fixed in O2)
The production build prerendered `/ja/assessment` and `/en/assessment` from `[locale]/[slug]` (a `pages` document with slug `assessment` exists) instead of from the dedicated `assessment/page.tsx`, giving an empty page with a `[TBD…]` title. Dev did not show it because dev does not prerender. Fix: `[slug]/page.tsx` no longer lists slugs that have their own route folder (`DEDICATED_ROUTE_SLUGS`). Logged in `docs/ENGINE-FIXES.md` and `docs/FINDINGS.md`. Verified in `.next/prerender-manifest.json` (`srcRoute` now `/[locale]/assessment`) and by the rerun.

## Related check: `e2e/seo.spec.ts` (GET-only, run alone)
38 passed, 14 failed. All 14 failures are the **soft heading-order assertion** (`h1 -> h3`, a level skipped); no other assertion failed on any route (title, description, canonical, hreflang, indexability and unique-title checks ran and passed on those pages). The tests were not changed.

| Routes (each in `ja` and `en`) | Count |
|---|---|
| `/`, `/ai-reception`, `/solutions`, `/how-it-works`, `/integrations`, `/about`, `/assessment` | 14 |

This is the known L1 finding (FINDINGS 2026-10-15, L1 item 2): shared engine blocks render card titles as `<h3>` with no `<h2>` above. The brief mentioned 12; the actual count is 14 because L1's list already included `/assessment`. **Unresolved:** fixing it means changing heading levels in shared `packages/cms-core` blocks, which affects every page using them and needs a decision. Axe's `heading-order` rule is a best-practice rule and is not in the tag set used here, so axe did not flag it.

## Exclusions (not checked, with reasons)

| Route(s) | Reason |
|---|---|
| `/company`, `/services` (+ `/services/[slug]`), `/news` (+ `/news/[slug]`), `/team` (+ `/team/[slug]`) | Clinic-era routes that are not Spec §4 pages. Marked `noindex` in O1 (commit `fface4f`) and left reachable. Not part of the launch surface. |
| `/booking/manage` | Token-based page, `noindex`; needs a booking token to show real content. |
| `/blog/[slug]` (post pages) | Content comes from the database; no fixed route list. Not covered. |
| `/line/*` (LIFF) | Not in the Spec; LIFF shell. |
| `/legal`, `/legal/*.html` | Redirects (301) to `/legal-notice` etc. |
| `/admin` | Payload admin; not a public page. |
| States behind interaction | Chat widget open state, booking flow steps, form error/success states, mobile menu open. Only the loaded page state is scanned. |
| Other E2E specs | `booking-journey`, `manage-appointment` and `reception-journey` were **not run**: they create or change appointments or call the chat and booking APIs (database writes). |

## Documented limitations (not fixed, not hidden)

1. **Temporary brand colours (register D2-01).** The navy `#1B2A45` / orange `#D97706` are placeholders. Axe reports no contrast violation with them, but contrast must be checked again when the real brand colours arrive. Axe also cannot evaluate contrast over images or gradients; those cases are "incomplete" results, which the script does not print.
2. **Placeholder images and alt text.** Axe only checks that an `alt` attribute exists. Every `<img>` has one (O1 crawl: 0 images without `alt`), but placeholder images are labelled stand-ins, some alt text is still `[JA TODO]` in `src/lib/image-slots.ts`, and the portrait alt text on the team cards is the person's name (FINDINGS N1). Alt-text quality needs human review once real images exist.
3. **`<html lang="ja">` in server-rendered HTML on `/en` pages.** The root layout sets `lang` to the default locale; a client component (`HtmlLangSetter`) corrects it after hydration. Axe runs after hydration, so it cannot see this. For crawlers, no-JS visitors and early screen-reader announcement, English pages are labelled Japanese (WCAG 3.1.1 in the strict reading). **Accepted as a known limitation (O1 decision, "Option C").** Planned fix when approved: move `<html>` into `[locale]/layout.tsx`.
4. **Heading order** on 14 route/locale combinations (above).
5. **Automated testing only.** No manual keyboard-only or screen-reader pass, no 200% zoom or reflow testing, no reduced-motion review, and only WCAG 2.1 AA tags (not 2.2). Automated tools find only a part of real issues.
6. **`/` and `/blog` each have one image with an empty `alt`.** Not confirmed decorative.

## Files changed for this report
- `apps/techmirai-web/scripts/a11y-check.ts`: route list from the Spec metadata with `ja`/`/en` prefixes; fails on serious/critical and on any non-200 route; prints moderate/minor.
- `package.json` (root): `a11y` alias.
- `apps/techmirai-web/src/app/(frontend)/[locale]/[slug]/page.tsx`: the catch-all fix above.
