# Findings

## 2026-10-04 — D1: `create-client-app.mjs` / `preflight-check.mjs` assume this repo is still the generic template

`scripts/create-client-app.mjs` scaffolds a brand-new client repo from this one (via `git
archive`) and replaces Sakura-clinic-specific values in `site.config.ts` with `__FILL_ME__`
sentinels. `scripts/preflight-check.mjs` is the matching CI gate that fails if a scaffolded
client repo still contains leftover Sakura content or unfilled sentinels. Both assume **this
repo is the generic clinic-demo template**, not a specific client's live site — which was true
before this project started (this repo itself was scaffolded that way) but stops being true as
Pack-2 replaces `site.config.ts`'s Sakura values with TechMirai's own.

D1 only updated the hardcoded `apps/clinic-demo/...` path constants in both scripts (now
`apps/techmirai-web/...`), per the approved D1 plan's narrow scope. Not addressed, and worth a
decision from Jamal later:
- Should these two scripts stay in the TechMirai repo at all, now that it's not a template?
- `create-client-app.mjs`'s `SITE_CONFIG_REPLACEMENTS` list includes several `bn:` (Bengali)
  entries for `site.config.ts` fields that D1 is removing. The script's own drift-detector will
  correctly fail loudly if anyone runs it against this repo post-D1 (by design — see its own
  comment), so this isn't a silent bug, but the list would need updating if the script is kept.
- Separately noticed: `preflight-check.mjs`'s header comment says it's "intended to run in CI
  ... see `.github/workflows/preflight.yml`," but no `.github/` directory exists anywhere in
  this repo — the referenced CI workflow was apparently never actually created.

No code change made for any of the above — flagging only, per standing rule 13.

## 2026-10-05 — D2: unused leftover clinic logo assets not cleaned up

`apps/techmirai-web/public/brand/` still has `logo2.png`, `logo3.png`, and
`Sakura-clinic-logo.png` left over from the clinic clone. Only `logo.svg` (now the TechMirai
text wordmark) is referenced by `site.config.ts`'s `brand.logoFile`; `Footer.tsx`'s own
hardcoded reference to `logo3.png` was fixed in D2 to use `siteConfig.brand.logoFile` instead.
D2 did not delete the other three files — removing unreferenced assets isn't named by D2's scope
and risks removing something another (unaudited) file still points at. Worth a cleanup pass
later. `favicon.ico` also still shows the old clinic icon — no safe ICO-generation tool was
available in this repo to regenerate it from the new wordmark; logged as `D2-02` in
`docs/PLACEHOLDER-REGISTER.md`.

## 2026-10-05 — D2: `hours-location` block's day-table UI won't fit the Spec's one-line hours

`site.config.ts`'s `contact.businessHours` changed from a clinic-style 7-day schedule object to
a single bracketed string (`{ weekdays: '[Weekdays 9:00–18:00]' }`), matching how the Content
Spec actually states TechMirai's hours (one phrase, not a day-by-day table). The
`hours-location` block (`packages/cms-core/src/blocks/hours-location/component.tsx`) expects
`monday`..`sunday` keys and renders a clinic-style ●/▲/休 table; with the new shape it would
render an empty-looking table (header row, no day columns) if ever placed on a page. No page
currently has a live instance of this block (`page.tsx`/`[slug]/page.tsx` only inject
`businessHours` into it conditionally), so nothing is visibly broken today. Flagging for
Pack-3 (content/pages), which will need to either redesign this block for a simple-hours
display or avoid placing it on TechMirai pages.

## 2026-10-05 — D2: hardcoded old clinic name in shared Hero block's logo alt text (resolved in E1)

`packages/cms-core/src/blocks/hero/component.tsx` hardcoded `alt="Sakura Osteopathic Clinic"`
and a `/brand/Sakura-clinic-logo.png` fallback on the hero logo image. Not fixed in D2 (flagged
here as needing a new prop). **Resolved in Pack-2/E1**, while already touching this file for its
nav-card icon maps: alt text changed to the generic `"Logo"` (no app-specific name, matching the
component's "pure function of raw block data" design — no `siteConfig` import), and the fallback
path changed to the generic `/brand/logo.svg` convention. `defaultNavItems` (which also
referenced clinic-only labels/icons) was emptied to `[]` for the same reason — a shared engine
component with no data renders nothing rather than another app's leftover pages.

## 2026-10-05 — D2: stale old-accent-color WCAG comments in shared Button/Badge components

`packages/cms-core/src/components/ui/Button.tsx:15-16` and `Badge.tsx:14-15` have comments
citing the pre-D2 accent hex (`#1D9E75`) to justify a hardcoded contrast-adjusted text color
(`#167758`) for their "secondary"/accent-on-tint variants. D2 changed the `accent` token to
orange (`#D97706`); these two components don't read `--color-accent` for this specific literal,
so nothing visually changed, but the comments' contrast-ratio math no longer describes the
actual current accent color. Not fixed in D2 — auditing every hardcoded arbitrary color across
the ~25 shared UI primitives for WCAG correctness against the new accent is a larger design-
system task than "a handful of files," per `docs/WORK-ORDER.md` §1.4. Flagging for a future
accessibility pass.

## 2026-10-04 — D1: small pre-existing doc inaccuracy fixed in passing

While re-running the "clinic-demo" grep sweep required by D1, found `ARCHITECTURE.md` claiming
`site.config.ts`'s `nav.socialLinks` point at `*-clinic-demo-placeholder` handles — the real
code uses `*-sakura-sekkotsu-placeholder` (confirmed by reading `site.config.ts` directly).
Pre-existing inaccuracy, unrelated to the rename; corrected the string since it was a one-line
fix encountered directly in the course of D1's own required grep check.
