# Engine fixes

## 2026-10-08 — Pack-3/H3: `process-steps`' `steps[].title` was required, with no way to omit it for a title-less list (fix)

**Symptom:** found while planning H3's five-step customer journey (Spec
§8.1), which has one sentence per step with no per-step title — unlike
every existing use of `process-steps` (homepage, `/ai-reception`), which
always populates `title`. The field was `required: true` on both the
Payload config and the TS type, and `component.tsx` rendered `step.title`
unconditionally.

**Fix:** removed `required: true` from `steps[].title`
(`config.ts`/`types.ts`), made it optional in `ProcessStep`, wrapped the
`<h3>` render in `{step.title && (...)}` (`component.tsx`), and changed
`adapter.ts`'s row filter from `.filter((s) => s.title)` to
`.filter((s) => s.line)` so title-less rows are no longer dropped.
Additive/non-breaking — existing usages already populate `title`, so
nothing already seeded is affected. Same fix shape as `process-steps`'
own H1 entry below (which did the equivalent loosening for `heading`).

**Status:** done.

## 2026-10-08 — Pack-3/H2: three blocks had a required `heading` with no way to omit it when the Spec gives none (fix)

**Symptom:** found while planning H2's industry-page template, which reuses
`problem-section` ("four problems") and `security-points` (twice: "what AI
受付 does" / "what staff still handle") under the page's own H1, with no
distinct heading of its own for either sub-section — the identical
situation `process-steps` already hit and was fixed for in H1. Both blocks
had `heading` as `required: true` on the Payload field and rendered it
unconditionally in `component.tsx`. The hub's `bento-grid` (4-card link
section) has the same situation for both `eyebrow` and `heading`.

**Fix:** removed `required: true` from `heading` in `problem-section` and
`security-points` (`config.ts`/`types.ts` each), and from `eyebrow`/
`heading` in `bento-grid`; each `component.tsx` now wraps its `<h2>` (and
`bento-grid`'s `<SectionEyebrow>`, which was already conditional) in
`{heading && (...)}`. Same fix shape as `process-steps`' H1 entry.

**Status:** done.

## 2026-10-11 — Pack-3/I1: `launch-scan-pages.ts`'s `ROUTES` list was missing `security` (fix)

**Symptom:** found while running Gate 3's launch-scan check for I1's two
new pages. `scripts/launch-scan-pages.ts`'s hardcoded `ROUTES` array
already listed `'pricing'` but not `'security'` — so `/security` was
silently never crawled by the scan at all (not a false pass; it was simply
absent from the list), even though `/pricing` and `/security` were seeded
as a pair in the same step.

**Fix:** added `'security'` to `ROUTES`, alphabetically next to `'privacy'`/
`'services'`. Additive/non-breaking — every other route is unaffected, and
the scan's "unknown route" skip-if-non-200 behavior (its own comment, line
~30) means adding a route that didn't exist yet would have been harmless
even before this step seeded real content for it.

**Status:** done — re-run confirms no old prices anywhere in the full scan
output. `/security`/`/en/security` now report the expected `B6_BRACKET_
PLACEHOLDERS` hits for every `[CONFIRM]`/bracketed item this step itself
seeded (all already logged in `docs/PLACEHOLDER-REGISTER.md` rows I1-01
through I1-06), plus the same site-wide, pre-existing hits every other page
already shows (phone number, business hours, demo URL, missing canonical/
hreflang, and the generic `meta.title`/`meta.description` "TBD... not yet
seeded" gap, which is identical across every page built so far — home,
ai-reception, how-it-works, integrations, solutions — since none of their
seed files touch `meta`, only `layout`; out of scope for this step).

## 2026-10-08 — Pack-3/H2: `bento-grid` had no way to make a card a link (fix)

**Symptom:** found while planning the Solutions hub's 4-card grid linking
out to the industry pages. `bento-grid`'s `items[]` had no `href` field —
every existing usage of this block is purely informational (e.g. "why
choose us" reasons), never a navigation card.

**Fix:** added an optional `href` field to `items[]`
(`config.ts`/`types.ts`/`adapter.ts`), and `component.tsx`'s `BentoCard`
now wraps itself in a locale-aware `<Link>` (same `withLocale()` helper
pattern already duplicated in 10+ other block components) when an item's
`href` is present, otherwise rendering exactly as before.

**Status:** done.

## 2026-10-08 — Pack-3/H2: `page-hero` had no field for a small disclaimer line (fix)

**Symptom:** found while planning the clinic page's fictional-demo
disclaimer (Spec §7.1's implicit need, reusing the same bracketed notice
already live on the homepage's `live-demo.smallPrint` since G2-G3 — see
docs/FINDINGS.md). `page-hero` had no equivalent field.

**Fix:** added an optional, localized `smallPrint` field to the hero
variant (`config.ts`/`types.ts`/`adapter.ts`), rendered directly under the
hero buttons in both the plain-text and image-background layouts,
styled identically to `live-demo`'s own `smallPrint` (`text-[11.5px]
italic text-text-muted`/`text-slate-500`).

**Status:** done.

## 2026-10-08 — Pack-3/H1 verification: `page-hero`'s `HeroButtons` still crashed on bracketed placeholder hrefs after the `withLocale()` fix below (fix)

**Symptom:** found live while re-verifying H1's Gate 3 after the
`withLocale()` fix immediately below was marked done. `/en/ai-reception`
and `/ai-reception` both 500'd with the same `Dynamic href
\`[demo.techmirai-ai.com]\` found in <Link>` error. The `withLocale()` fix
only stops the helper from *locale-prefixing* a bracketed value — it does
nothing about the fact that Next.js's app-router `<Link>` rejects **any**
href containing `[`/`]`, prefixed or not. `hero`/`live-demo` never hit this
because those two blocks already render their `demoUrl`-fed button as a
plain `<a>`, not `<Link>` — a fact the `withLocale()` fix entry itself
noted ("a hand-avoided case, not a real fix") but didn't act on for the
other blocks it flagged as at-risk, including `page-hero`.

**Fix:** `packages/cms-core/src/blocks/page-hero/component.tsx`'s
`HeroButtons` now renders `primaryButton`/`secondaryButton` as a plain
`<a href={...}>` whenever that button's href starts with `[`, and as
`<Link href={withLocale(...)}>` otherwise — matching the existing
`hero`/`live-demo` pattern instead of relying on `withLocale()` alone.
`cta-banner`/`team-grid`/`product-edition` (the other 3 blocks the
`withLocale()` entry flagged as equally at risk) were not touched here —
none of them currently have a seeded bracketed-placeholder href in any
page, so there was nothing to reproduce or verify against; worth applying
the same pattern proactively if one ever does.

**Status:** done. Verified by loading `/en/ai-reception`, `/ai-reception`
(default JA), and `/ja/ai-reception` after the change — all resolve
correctly (200/200/307), not just by re-reading the diff.

## 2026-10-08 — Pack-3/H1: `withLocale()` crashed on bracketed placeholder hrefs like `demoUrl` (fix)

**Symptom:** found live while verifying H1's Gate 3. `/ai-reception` 500'd:
`Error: Dynamic href \`/en/[demo.techmirai-ai.com]\` found in <Link> while
using the \`/app\` router, this is not supported.` The page's hero
secondary button links to `siteConfig.integrations.demoUrl`, whose current
value is the literal bracketed placeholder `[demo.techmirai-ai.com]` (Spec
gives no real URL yet — F1-19). `withLocale()` — a small helper duplicated
verbatim across 10 block `component.tsx` files — treats any href not
starting with `http`/`#` as a safe internal path and prefixes it with the
locale, turning `[demo.techmirai-ai.com]` into `/en/[demo.techmirai-ai.com]`
— which Next.js's `<Link>` then parses as an (invalid) dynamic route
segment and throws. `hero`/`live-demo` (Pack-3/G1-G2) never hit this
because their specific demoUrl-fed buttons happen to bypass `withLocale`
entirely (`href={buttonHref}` raw) — a hand-avoided case, not a real fix,
and every other block built since (`cta-banner`, `team-grid`,
`product-edition`, `page-hero`) would crash the same way the moment any
future step feeds them a bracketed placeholder href.

**Fix:** added `|| href.startsWith('[')` to the early-return guard in all
10 duplicated copies of `withLocale()` (`hero`, `live-demo`, `news-list`,
`downloads-grid`, `image-text-split`, `blog-teaser`, `page-hero`,
`cta-banner`, `team-grid`, `product-edition`), so a bracketed value is
always passed through unchanged, matching the Spec's own convention that
bracketed text is a literal placeholder, never a real route. The
underlying duplication (one helper, copy-pasted 10 times) is left as-is —
collapsing it into a shared import is a larger refactor than this fix
needed, and is worth a future cleanup pass, not bundled in here.

**Status:** done.

## 2026-10-08 — Pack-3/H1: `page-hero`'s `body`/buttons were typed and parsed but never rendered; no-image case forced a "No image" placeholder box (fix)

**Symptom:** found while planning H1's simple eyebrow+H1+body+2-button hero
(Spec §6.1, no background photo). `packages/cms-core/src/blocks/page-hero`'s
`hero` variant has had `body`/`primaryButton`/`secondaryButton` fields in
`config.ts`/`types.ts` since the block was built, and `adapter.ts` already
parsed all three correctly — but `component.tsx`'s `PageHeroBlock` never
destructured or rendered any of them, so filling them in via the CMS
produced no visible change. Separately, when `backgroundImage` is empty,
the component rendered a literal gray "No image" placeholder box instead of
a clean text-only hero — there was no code path for "this page genuinely
has no photo."

**Fix:** added an `eyebrow` field (text, localized — didn't exist at all).
Wired `body`/`primaryButton`/`secondaryButton` into the existing
image-background layout (rendered inside the same text-overlay area as
`heading`/`coloredSubtitle`). Added a new `PlainTextHeroVariant` sub-
component, used automatically whenever `backgroundImageUrl` is absent —
a simple centered-or-left eyebrow/H1/body/buttons layout with no diagonal
image cutout, replacing the forced gray box.

**Status:** done. Benefits any future page using `page-hero` without a
background image, not just `/ai-reception`.

## 2026-10-08 — Pack-3/H1: `process-steps`'s `heading` was required, with no way to omit it when the Spec gives none (fix)

**Symptom:** found while seeding H1's "seven things it does" section (Spec
§6.2), which — unlike every other use of this block so far — has no H2 row
in the Spec at all. `heading` was `required: true` on the Payload field and
rendered unconditionally in `component.tsx`, so there was no way to
represent "the Spec genuinely gives no heading here" without inventing one
(CLAUDE.md rule 5) or leaving an empty `<h2></h2>` in the DOM.

**Fix:** removed `required: true` from `heading` in `config.ts`/`types.ts`;
`component.tsx` now wraps the `<h2>` in `{heading && (...)}`. No existing
usage (Pack-3/G3's "Implementation process") is affected — it already
supplies a heading.

**Status:** done.

## 2026-10-04 — `@next/env` v15 / tsx interop on Windows (fix)

**Symptom:** scripts that boot Payload directly via `tsx` (seed scripts, `db:apply-indexes`)
failed to load `.env.local` on Windows, because `@next/env` v15 sets `__esModule: true` but has
no `.default` export. Payload's `loadEnv.js` does `import x from '@next/env'`, which `tsx`
compiles to `require('@next/env').default` — `undefined` without a shim.

**Fix:** `apps/techmirai-web/fix-next-env-interop.cjs` patches `.default` onto the CJS export
whenever it's missing, loaded via `NODE_OPTIONS="--require ./fix-next-env-interop.cjs"` in the
`seed`, `seed:demo`, `seed:booking` and `db:apply-indexes` package.json scripts. `@next/env` was
also pinned as an explicit `dependencies` entry (previously only a transitive dep of `next`) so
pnpm resolves it reliably on Windows.

**Status:** done, keep as-is.

## 2026-10-04 — Payload migration CLI broken in this monorepo (known gap, not fixed)

**Symptom:** `payload migrate` / `payload migrate:status` fail outright. The bundled CLI
internally pins an older `tsx` that can't resolve this repo's cross-package extensionless
imports (e.g. `config-factory.ts`'s `../schema/site-config`). No `migrations/` directory has
ever been generated.

**Current workaround (dev only):** `apps/techmirai-web/payload.config.ts` sets the Postgres
adapter's `push: true` instead of the committed `push: false`, so Payload auto-syncs the schema
on boot. This is how the dev database got its tables.

**Why this isn't fixed here:** the `payload.config.ts` comment marks this as a known gap, with a
confirmed working alternative for one-off DDL (boot Payload directly via the same `tsx` +
`fix-next-env-interop.cjs` invocation the seed scripts use, and call `applyBookingIndexes()`
etc. directly). The comment explicitly says a production-safe automated migration path does not
exist yet and "must be fixed before WO-8" (production go-live) — i.e. it's a pre-launch
blocker, not a Pack-2 task.

**Status:** open. `push: true` stays for development. Revisit before WO-8.

## 2026-10-04 — `.gitignore` missing its own media-ignore pattern (fix)

**Symptom:** `.gitignore` has a comment (above the playwright section) explaining that
generated/uploaded media under `public/media/` "shouldn't be committed — R2 is the real storage
backend once configured," but no actual glob pattern was ever added underneath it. As a result
`apps/techmirai-web/public/media/` (50 demo seed images/PDFs from `pnpm seed:demo`) showed up as
untracked and would have been committed by accident.

**Fix:** added `apps/*/public/media/` under the existing comment. Scoped to `apps/*` (not a bare
`public/media/`) so it still only matches per-app media folders regardless of what the app
folder is named (it already survived D1's rename of `apps/clinic-demo` to `apps/techmirai-web`
unchanged, by design).

**Status:** done.

## 2026-10-04 — D1: `Footer.tsx` unconditionally fetched the clinic-only `medical-disclaimer` global (fix)

**Symptom:** found live while verifying D1's Gate 3 (clear `.next`, boot `pnpm dev`, check for
console errors). After turning off `verticals.clinic`, `/en` returned 200 but logged
`[Footer] medical-disclaimer global unavailable: Error [APIError]: The global with slug
medical-disclaimer can't be found` on every render — `Footer.tsx` called
`payload.findGlobal({ slug: 'medical-disclaimer' })` unconditionally and only caught the
resulting error, it never checked whether the global was actually registered.

**Fix:** guarded the fetch behind `siteConfig.verticals.clinic` (the same flag
`config-factory.ts` already uses to register `MedicalDisclaimerGlobal` in the first place), so
it's skipped entirely instead of fetched-then-caught every request.

**Status:** done. This was not caught by the earlier static-analysis risk review (which checked
seed scripts only) — a reminder that turning any vertical flag off needs an actual `pnpm dev`
boot check, not just a grep for the collection/block slugs.

## 2026-10-04 — D1: `push: true` crashed once on a stale FK-constraint-drop statement (resolved itself)

**Symptom:** the first `pnpm dev` boot after turning off `verticals.clinic` crashed with
`Failed query: ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_doctors_fk"` /
`constraint "pages_rels_doctors_fk" of relation "pages_rels" does not exist` (Postgres error
42704). Payload's `push: true` schema sync generates its DDL plan from one snapshot, but
dropping the `doctors` table in an earlier statement of the same plan appears to auto-drop the
dependent FK constraint on `pages_rels` as a side effect — so the plan's own later, explicit
`DROP CONSTRAINT` step for that same (already-gone) constraint then fails.

**Resolution:** restarting `pnpm dev` (which makes `push: true` recompute the diff against the
now-current schema) completed cleanly — the stale constraint-drop step was no longer in the
plan, and the two orphaned columns it needed to drop (`pages_rels.doctors_id`,
`pages_rels.services_id` — unused once `doctor-grid`/`department-list` were unregistered) were
removed successfully. Confirmed via a direct read-only query against `pages_rels` afterward.

**Status:** not a code fix — a one-time, self-resolving hiccup in `push: true`'s diffing on this
specific kind of structural change (dropping a whole collection that other tables have FKs
into). Logged here as a known quirk: if a future vertical-flag flip crashes the same way, a
`pnpm dev` restart is the fix, not a rollback. Related to the already-logged "migration CLI
broken" gap above — another data point that `push: true` is a dev-only stopgap, not production-
grade schema management.

## 2026-10-05 — D2: stale duplicate LINE-URL fallbacks in shared engine components (fix)

**Symptom:** found while re-running D2's own grep-cleanliness check across the whole repo (not
just `apps/techmirai-web`). Two shared `packages/cms-core` components each carry their own
hardcoded "fallback only" LINE URL, explicitly commented as meant to mirror
`site.config.ts`'s `reception.staffLineUrl` — but each had drifted to a different stale value:
`blocks/hero/component.tsx`'s `resolvedLine` fallback still had the handle from before D2
(`~nahidarahamanrupta`), and `components/ui/FloatingCTAs.tsx`'s `DEFAULT_LINE_URL` still had an
even older one (`@470vmlzv`, the same stray value D2 already removed from
`apps/techmirai-web`'s `Footer.tsx`). Both are genuinely fallback-only (the real value flows in
as a prop from `resolveHeaderData` once that fallback was fixed in D2), so neither was visibly
broken for techmirai-web today — but a future app on this engine, or a prop regression, would
silently serve one of these three different fake handles instead of the one true convention.

**Fix:** updated both literals to the same placeholder (`~techmirai-placeholder`) D2 set in
`site.config.ts`, matching each file's own documented intent to track that one value. Purely a
value correction — no behavior/API change.

**Status:** done, keep as-is.

## 2026-10-05 — E1: `locale: 'all'` updateGlobal drops a GROUP field's localized sub-field (fix)

**Symptom:** found while seeding the Header global's new `ctaButton` for Pack-2/E1. A single
`payload.updateGlobal({ locale: 'all', data: {...} })` call correctly persisted `navItems[].label`
(an ARRAY field's localized sub-field — confirmed by reading it back as `{en: "AI受付", ja:
"AI受付"}`), but the same call's `ctaButton.label` (a GROUP field's localized sub-field, same
`localized: true` schema flag) came back as `{en: null}` with no `ja` key at all — silently
dropped, no error thrown.

**Fix:** in `apps/techmirai-web/src/seed/demo/globals-header.ts`, `ctaButton.label` is now
written via two separate single-locale `updateGlobal` calls (`locale: 'en'`, then `locale:
'ja'`) after the main `locale: 'all'` write, instead of inside it. This works because by that
point `navItems` already has both locales' required labels filled, so the single-locale updates
don't hit the "empty required label fails global validation" issue that `navItems` itself ran
into historically (see the file's own doc comments).

**Status:** done for this one field. Open question: is this specific to GROUP vs ARRAY field
types under `locale:'all'`, or something about this field's position/depth in the document? Not
investigated further — the workaround is cheap and the bug is narrow (only matters for
group-type localized fields seeded via `locale:'all'`). Worth retesting if Payload/the Postgres
adapter is upgraded.

## 2026-10-05 — F2: case-studies collection was wired to the recruitment vertical flag, not its own feature flag (fix)

**Symptom:** found while planning Pack-2/F2's Sadiatec case-study visibility switch.
`config-factory.ts` registered `CaseStudiesCollection` only when `siteConfig.verticals.recruitment`
was true, and `site.config.ts`'s `features.caseStudies` was itself just `= recruitmentVertical`.
Pack-2/D1 deliberately set `recruitmentVertical = false` for this site, so the case-studies
collection was never registered at all — silently breaking Pack-3's planned Sadiatec case-study
page (G3/I3) regardless of any visibility field F2 added, since case studies aren't a recruitment
feature (jobs/seminars are; the Sadiatec case study is used on the homepage, About and its own
page).

**Fix:** `site.config.ts` now computes `features.caseStudies` from its own independent
`caseStudiesEnabled = true`, not from `recruitmentVertical`. `config-factory.ts` gates
`CaseStudiesCollection` on `siteConfig.features.caseStudies` instead of
`siteConfig.verticals.recruitment`; `JobsCollection`/`SeminarsCollection` stay gated on the
recruitment vertical, since those two genuinely are recruitment-only.

**Status:** done. Confirmed with Jamal before fixing (F2 plan review) rather than assumed.

## 2026-10-06 — F2: `push: true` asks a one-time interactive question the first time it boots after this change (expected, not fixed)

**Symptom:** found while verifying F2's Gate 3 (`pnpm dev` boots, no console errors).
`faqs.ts`'s `category` field changed from a localized `text` (stored in `faqs_locales`) to a
plain `select` (stored in the base `faqs` table), landing in the same push as the new `keywords`
field being *added* to `faqs_locales`. Drizzle's schema-diffing sees one text-ish column dropped
from `faqs_locales` and one added, and can't tell on its own whether that's "add `keywords`" or
"rename `category` to `keywords`" — so the first `pnpm dev` boot after this change prints:

```
Is keywords column in faqs_locales table created or renamed from another column?
❯ + keywords            create column
  ~ category › keywords rename column
```

and waits on stdin for someone to confirm. This is an interactive terminal prompt — it can only be
answered by a human sitting at `pnpm dev`'s own terminal (confirmed: piping input via `yes ""` and
via `winpty` from a separate, non-attached automation session both failed to reach it; the
dev-server process hung on `/admin` past 90s either way, though some non-DB-dependent routes like
plain `/en` still returned 200 while it was waiting).

**What to do:** the correct answer is already the highlighted default — **just press Enter** (or
explicitly pick "+ keywords create column"). This is the right choice: it's a genuinely new
column, not a rename; nothing is actually being renamed. Never pick "rename" here.

**Checked against the actual data, not assumed:** a read-only query against the dev database
(2026-10-06) found that `faqs`/`faqs_locales` are **not** empty — they hold 9 existing documents
(18 `faqs_locales` rows) with real `category` values (`Insurance & Payment`/`保険・お支払い`,
`Treatment`/`施術について`, etc.). Traced to `apps/techmirai-web/src/seed/demo/faqs.ts` — these are
leftover **clinic-demo** FAQ rows from an earlier `pnpm seed:demo` run, already flagged for removal
in Pack-2/F3 (see the F1 "normal preflight was already FAILING" entry above), not TechMirai
content. If "rename" were picked instead of "create column," every one of those 18 rows' old
category label would be copied verbatim into the new `keywords` field (nonsense content for a
keywords column), while the new base-table `category` enum column would come back `NULL` for all
9 docs, since nothing actually migrates old values into it. "Create column" avoids both: existing
rows simply get `keywords = NULL` and a fresh `category = NULL` on the base table, which is
harmless *specifically because* this data is disposable demo content already scheduled for
deletion, not because the table happens to be empty — it isn't.

**General lesson, not just this field:** this prompt appears because `category` moved out of
`faqs_locales` (de-localized into the base `faqs` table) in the same push that added a new
localized `keywords` column into `faqs_locales` — a table losing one column and gaining another
in one diff reads as a possible rename to Drizzle, regardless of whether the two fields are
actually related. The same shape of change (a field crossing from the localized table to the base
table, or vice versa, combined with a sibling field being added to the table it's leaving) will
trigger the same ambiguous prompt again in future steps — and once real TechMirai content has been
seeded into whatever table is involved, picking the wrong option would silently corrupt live data
the way described above, not just stale demo rows. Worth the extra beat of double-checking what's
actually in the affected table before answering, rather than assuming it's empty.

**Why this isn't "fixed":** it's an inherent characteristic of `push: true` schema-diffing
whenever a push both drops and adds a plausibly-related column in the same table in one shot —
not a bug introduced by F2, and not fixable without either avoiding that shape of change (not
worth contorting the schema for) or restoring a working `payload migrate` (the pre-launch item
already tracked above). Logged here per the same pattern as the other `push: true` quirks already
in this file (the FK-constraint-drop hiccup, D1).

**Status:** open, informational. Confirmed by code-level trace (drizzle-kit's bundled
`columnsResolver`/ambiguous-rename path in `pushSchema`) and by a direct read-only query of the
dev database (not just observed terminal behavior). One-time for this specific column pair;
answer "+ create column" the one time it appears.

## 2026-10-06 — F2: the interactive push hung even after picking the correct answer; replaced with an explicit migration script

**Symptom:** the prompt above reappeared on a later `pnpm dev` boot and hung on `/admin` even
after selecting "+ keywords create column." Automation cannot answer this prompt (see the entry
above); it turned out a human at an attached terminal couldn't reliably get past it either in this
case. The `turbo dev` / `next dev` / `next` server processes were stopped and not retried.

**What was done instead:** added `packages/cms-core/src/payload/collections/migrations/faq-keywords-category.ts`,
a hand-written idempotent DDL module mirroring `booking-indexes.ts`/`customer-line-fields.ts`
(`CREATE TYPE enum_faqs_category`, `ALTER TABLE faqs ADD COLUMN category`, `ALTER TABLE
faqs_locales ADD COLUMN keywords`, `ALTER TABLE faqs_locales DROP COLUMN category`), plus a
one-off runner script `apps/techmirai-web/scripts/apply-faq-schema-migration.ts` (run via
`pnpm --filter techmirai-web run db:migrate-faq-keywords-category`). The runner sets
`PAYLOAD_MIGRATING=true` before calling `getPayload()`, which makes `@payloadcms/db-postgres`'s
`connect()` skip `pushDevSchema` entirely (see its `connect.js`: `if (... && process.env
.PAYLOAD_MIGRATING !== 'true' && this.push !== false) { await pushDevSchema(this) }`) — so booting
Payload for this script never triggers the diff/prompt at all.

**Why this is safe here, specifically:** the migration's `DROP COLUMN category` on `faqs_locales`
is **not additive** — it discards existing row data. This is only safe because, as established in
the schema-comparison diagnosis above, the only rows affected are the 9 leftover clinic-demo FAQ
documents (18 `faqs_locales` rows) already slated for removal in Pack-2/F3, not TechMirai content
(now done — see the F3 entry below).
Do not reuse this script's drop step against a database that might hold real FAQ content without
re-verifying row contents first.

**Status:** resolved for this specific change via the explicit migration script. The underlying
gap (no production-safe automated migration path; `push: true` can hang on ambiguous diffs even
when answered correctly) remains open and tracked under the 2026-10-04 entry above, due before
WO-8.

## 2026-10-06 — F3: seed media re-upload could orphan files when a stale doc survives a failed delete (fix)

**Symptom:** the retired clinic-demo seed (`apps/techmirai-web/src/seed/demo/lib/clear.ts`) used
stable, deterministic media filenames (e.g. `demo-team-01.png`) but could leave a stale `media`
doc in place when its delete failed (a required relationship elsewhere still pointed at it — see
`deleteWhere()`'s catch-and-warn behavior). On the next reseed, re-uploading a file under that same
filename hit Payload's storage adapter, which — finding a same-named file already on disk —
silently suffixed a new filename (`-1.png`) rather than reusing the existing doc. Flagged by
Pack-2/F3's own task text ("Project notes say reseeding used to orphan media. Check whether that
is fixed; if not, fix it as an engine fix and log it.") — confirmed still open, not previously
fixed.

**Fix:** `apps/techmirai-web/src/seed/media.ts`'s `upsertMedia()` now checks for an existing
`media` doc with the target filename (`payload.find({ collection: 'media', where: { filename: {
equals: name } } })`) before calling `create()`, reusing its id if found. This makes the upload
step idempotent regardless of whether a stale doc's delete ever succeeded — the actual guarantee
needed ("no new orphan media" on a second `pnpm seed` run), and strictly safer than chasing every
possible FK-ordering edge case in the delete path itself.

**Status:** fixed. Verified by running `pnpm seed --confirm` twice in a row and confirming no
`-1`/`-2`-suffixed duplicate filenames appear in the `media` collection or `public/media/` after
the second run.

## 2026-10-07 — Pack-3/G0: reception chat widget always greeted in Japanese, ignoring page locale (fix)

**Symptom:** on `/en/...` pages, the reception widget's teaser bubble and panel both opened in
Japanese instead of English. Found and flagged during Pack-2/E2 (see `docs/FINDINGS.md`'s
2026-10-05 "reception chat widget always greets in Japanese" entry); logged there as owed its own
`docs/ENGINE-FIXES.md` entry per CLAUDE.md rule 11, but never written until now.

**Root cause:** `apps/techmirai-web/src/app/(frontend)/[locale]/layout.tsx` has the real route
locale in scope (`const { locale } = await params`) but never passed it to `<ReceptionWidget>`.
`ReceptionWidget` (`packages/cms-core/src/verticals/clinic/reception/ui/ReceptionWidget.tsx`) had
no `locale` prop at all — it derived its own `initialLocale` from `locales[0]`, the first entry of
the static `reception.locales` capability array (`['ja', 'en']` in `site.config.ts`), which always
evaluates to `'ja'` regardless of the actual page. That wrong value fed both the teaser's greeting
text and `ReceptionPanel`'s `initialLocale` prop, so the whole widget opened in Japanese by default
everywhere, correcting only if the visitor manually tapped the in-panel EN toggle.

**Fix:** added a `locale: string` field to `ReceptionWidgetProps`, passed from the layout
(`locale={locale}`), and changed the derivation to `locales.includes(locale) ? locale :
locales[0] ?? 'ja'` — preferring the real route locale, falling back to the static array only if
the route locale somehow isn't one of the widget's supported locales. No changes were needed in
`ReceptionPanel.tsx` or `useReceptionEngine.ts`: both already key correctly off their own `locale`
state once it starts from the right value.

**Status:** fixed. Verify by loading `/en/...` and `/ja/...` and confirming the teaser bubble and
freshly-opened panel show the matching language on each, before touching the in-panel toggle.

## 2026-10-12 — Pack-3/I2: the founder-visibility switch did nothing on any page except the homepage (fix)

**Symptom:** found while planning `/about`, whose own Done-when requires the founder switch
(`company-info` global's `founder.visible`) to hide the founder message, bio, photo and
company-profile row on that page. Checking how founder-hiding currently works
(`apps/techmirai-web/src/app/(frontend)/[locale]/page.tsx`, the homepage's own bespoke route)
showed the `founderVisible`/`founderPersonId` injection for `team-grid` blocks lived only there.
The generic catch-all `apps/techmirai-web/src/app/(frontend)/[locale]/[slug]/page.tsx`, which
renders every other page including `/about`, had no founder-awareness at all — the switch was a
no-op anywhere except the homepage, even though Pack-3/G4 already seeded a `team-grid` on the
homepage specifically to exercise it.

**Fix:** `[locale]/[slug]/page.tsx` now fetches the `company-info` global's `founder` field once
per page load (same `payload.findGlobal` call the homepage already makes) and, inside its
existing per-block `Promise.all` transform, adds three branches: injects
`founderVisible`/`founderPersonId` into `team-grid` blocks (verbatim copy of the homepage's
branch); drops `ceo-message` blocks entirely when `founder.visible === false`; and strips any
`label-value-list` row flagged `founderGated` under the same condition. Since the `ceo-message`
branch can now return `null`, the resolved blocks array gets one added `.filter((b): b is
RawBlock => b !== null)` pass before rendering.

**Status:** fixed. Verify by toggling `company-info`'s `founder.visible` to `false` in `/admin`,
reloading `/about`, and confirming the founder-message block, Jamal's team card and the
company-profile "Representative" row all disappear — then set it back to `true`.

## 2026-10-12 — Pack-3/I2: `team-grid`'s `showBio` field was wired but never rendered (fix)

**Symptom:** `team-grid/config.ts` has had a `showBio` checkbox since it was first built ("Show
full bio (recommended for team index page)"), and `adapter.ts` already returned
`showBio: data['showBio'] === true` on every block. But `component.tsx`'s `TeamGridBlock` never
destructured `showBio` from its props, and its `Card` sub-component only ever rendered a member's
one-line `shortBio` (as `line`) — there was no code path anywhere that rendered a team member's
full `bio` richText field, regardless of `showBio`. Found while building `/about`'s Team section
(Spec §10.4, "full bios"), which depends on this actually working.

**Fix:** `adapter.ts`'s `RawTeamDoc` gained `bio?: unknown`, extracted via the existing
`extractRichText` helper into a new optional `fullBio` on each mapped `TeamGridCardMember`.
`component.tsx` now destructures `showBio` and passes it plus `fullBio` into `Card`, which renders
`fullBio` (split into paragraphs, same convention as `ceo-message`) instead of the one-line `line`
when `showBio` is true and `fullBio` is present, falling back to `line` otherwise. Additive — no
existing `team-grid` usage (the homepage's, with `showBio: false`) is affected.

**Status:** fixed. Verify on `/about`: all 5 Team cards show full paragraph bios, not just the
one-line description; the homepage's own `team-grid` (`showBio: false`) is unchanged.

## 2026-10-12 — Pack-3/I2: `ceo-message` rendered an invented, un-cleaned motto on every instance (fix)

**Symptom:** `ceo-message/component.tsx` hardcoded an EN/JA "motto" heading ("Learn together,
enjoy life, and strive for success." / "共に学び、人生を楽しみ、成功を目指す。") rendered
unconditionally above every message, regardless of CMS content. This text does not appear
anywhere in the TechMirai Content Spec — it reads like an uncleaned leftover from a different
template this block was ported from. Found while reviewing the block for reuse on `/about`'s
founder-message section (Spec §10.2); confirmed via grep that `ceo-message` had never been seeded
anywhere before this step, so nothing live was showing this text.

**Fix:** removed the `motto`/`mottoBreak` dictionary entries and the `<h2>` that rendered them
from `component.tsx`'s `labels` map and `textEl`; kept the accurate "代表メッセージ / Message from
the Representative" sub-heading above the signature area, which does match the Spec's own section
name (代表挨拶) and isn't invented.

**Status:** fixed. Verify `/about`'s founder-message block shows no motto text above the message
paragraphs.

## 2026-10-12 — Pack-3/I2: required richText fields fail Payload's `locale:'all'` merge write (fix)

**Symptom:** seeding `/about` failed with `ValidationError` on `ceo-message`'s `message` field and
`rich-text`'s `content` field — both richText, both `required: true` — even though the content
supplied was valid and non-empty. `packages/cms-core/src/seed/utils.ts`'s own `createLocalizedDoc`
comment already documents the root cause: Payload's richText `required` validator inspects
`value?.root?.children` directly, before the `locale:'all'` write-transform unwraps `{ [locale]:
value }` — so a required richText field inside any multi-locale `createLocalizedDoc`/
`updateLocalizedDoc` merge write fails validation regardless of content, a known Payload
limitation the single-locale fast path already sidesteps but the 2+-locale path cannot. Every
other richText field seeded so far (`team.bio`, `faqs.answer`) happened to not be `required: true`
at the field level, so this is the first time a seed step's content tripped it.

**Fix:** removed `required: true` from `ceo-message/config.ts`'s `message` field and
`rich-text/config.ts`'s `content` field — the schema-level enforcement, not the underlying
Payload merge bug. Safe because neither block had ever been seeded before this step (confirmed via
grep), so no already-seeded content depends on the admin-UI "required" nag for either field.

**Status:** fixed. Verify `pnpm seed --confirm` completes `/about`'s seed step without a
`ValidationError`.

## 2026-10-12 — Pack-3/I4: generic page-level noindex support (addition)

**Why:** `/thanks` (Spec p.16: "After any form. noindex") needed a real `<meta name="robots">`
directive, not just the existing `robots.ts` disallow entry — search engines that already indexed
a URL before a robots.txt disallow was added can still show it in results; a page-level noindex
tag is the standard belt-and-suspenders fix, and the pack's own I4 Done-when list requires it
("/thanks sends a noindex signal").

**Fix:** added one additive `noindex` checkbox field to `PagesCollection`'s existing `meta` group
(`packages/cms-core/src/payload/collections/pages.ts`) and one additive branch in
`[locale]/[slug]/page.tsx`'s `generateMetadata` that adds `robots: { index: false, follow: false }`
when `meta.noindex` is checked. Generic and reusable by any future page (draft pages, other
form-result pages), not thanks-specific. Defaults to `false`, so every existing page's rendered
metadata is unchanged.

**Status:** added. Verify `/thanks` and `/en/thanks` render a `noindex,nofollow` robots meta tag
and that an unrelated page (e.g. `/about`) is unaffected.

## 2026-10-12 — Pack-3/I4: page-hero LINE-link injection, reusing the cta-banner sentinel idiom

**Why:** `/thanks`'s Spec §12.3 body references a "message us on LINE" link. The real LINE URL is
a WORK-ORDER decision-5/F1-14-adjacent placeholder (`site.config.ts`'s `reception.staffLineUrl`,
not a real LINE account yet) and is only resolved at render time via `resolveHeaderData()` —
exactly the mechanism `[locale]/[slug]/page.tsx`'s existing `cta-banner` branch already uses
(injecting the resolved LINE href into any `cta-banner.secondaryButton` when `showContactStrip`
is true). `/thanks` uses a `page-hero` block, not `cta-banner` (every existing `cta-banner` usage
sets a required `primaryButton`, and the Spec gives this page no primary action once the booking
CTA is omitted — see docs/FINDINGS.md), so `page-hero` had no equivalent injection path.

**Fix:** added one additive branch to the same block-resolution loop: when a `page-hero` block's
`secondaryButton.href` is the sentinel `'#'`, it's replaced with the real resolved LINE href —
same sentinel convention `cta-banner` already uses, just extended to one more block type. Confirmed
no existing `page-hero` usage anywhere in the repo sets `secondaryButton.href` to `'#'` (both
existing usages, on `/ai-reception`, link to a real demo URL), so this only fires where a seed file
deliberately opts in.

**Status:** added. Verify `/thanks` and `/en/thanks` render the LINE button with a real resolved
href (not the literal `'#'`), in both locales.

## 2026-10-13 — Pack-4/J2: `seed:booking` silently did nothing on Windows (fix)

**Symptom:** `pnpm --filter techmirai-web seed:booking` failed on this Windows machine with `'NODE_OPTIONS' is not recognized as an internal or external command` (pnpm runs scripts through `cmd`, which rejects the POSIX `NODE_OPTIONS="…"` prefix). Run through Git Bash instead, the command exited 0 but printed nothing and changed no data.

**Cause (two independent faults):** (1) the inline `NODE_OPTIONS=` prefix in the `seed:booking` script; (2) the "run only when executed directly" guard at the bottom of `apps/techmirai-web/src/seed/booking.ts` compared `import.meta.url` with `` `file://${process.argv[1]}` ``. On Windows `import.meta.url` is `file:///C:/…` while `process.argv[1]` is `C:\…`, so the comparison was always false and `runStandalone()` never ran.

**Fix (approved by Jamal as D-10):** the guard now compares `import.meta.url` with `pathToFileURL(process.argv[1]).href` (and is skipped when `argv[1]` is absent), and the `seed:booking` script is `tsx --require ./fix-next-env-interop.cjs --env-file=.env.local src/seed/booking.ts`, with no inline environment prefix. Only `seed:booking` was changed: the `seed` and `db:*` scripts carry the same inline prefix and are left alone (logged in docs/FINDINGS.md, rule 13).

**Safety guard (added before commit, approved by Jamal):** because the fix makes `seed:booking` actually run on Windows, `runStandalone()` now also refuses unless `DATABASE_ENV === 'development'` (the same opt-in the unified `pnpm seed` already requires in `seed/index.ts`), exiting 1 before `getPayload` and any DB connection. It is an attestation, not proof: code cannot verify that a remote database is really a development one.

**Verification:** `pnpm typecheck` and the unit tests only. **The live seed run is UNVERIFIED**: the target is a remote Postgres whose name carries no dev/prod marker, Jamal has not confirmed in this session that it is the development database, and he declined the run. That the script now starts and logs on Windows, and that `tsx --require` is accepted, has therefore not been observed.

**Status:** code changed, live behaviour unverified.

## 2026-10-13 — Pack-4/K1: choice buttons can be links, and the host can jump to a node (engine addition)

**Need (not a bug):** Spec §16.2–16.3 give most answers "next buttons" that mix pages to open (some in a new tab), inline booking, and Menu. The engine's choice options could only step to another node, and its `link` node is a single-button dead end, so the Spec's answers could not be expressed. Under `docs/WORK-ORDER.md` §1.4 this was a Spec-versus-engine conflict; Jamal approved this small generic fix. The Spec also asks for an always-visible "Talk to a person" link, which needs a way to reach a node from any point in the conversation.

**Change (generic; nothing TechMirai-specific):**
- `packages/reception-engine/src/types.ts`: `ChoiceOption` gains optional `href` and `newTab`; `Interaction`'s choice options carry them through. `next` stays required: a link option points it back at the node it lives on.
- `packages/reception-engine/src/engine.ts`: `getInteraction` passes `href`/`newTab` through. New exported `goTo(flow, state, nodeId, locale, resolve, triage?)` jumps to a named node and runs forward; pure, clones state, clears a pending prompt suppression, and leaves the state untouched for an unknown node id. `advance` is unchanged: a link option is rendered as an anchor by the host and never sent to it.
- `packages/reception-engine/src/index.ts`: exports `goTo`.

**Verification:** `packages/reception-engine/src/engine.links.test.ts` (7 tests: link fields exposed on link options only; `goTo` jumps and shows the prompt; runs through auto-advancing nodes; does not mutate the previous state and keeps its data; clears prompt suppression; unknown node leaves state untouched; a normal choice still advances afterwards). The existing 40 engine tests are unchanged and pass.

**Status:** code changed and unit-tested. Not observed in a browser by this entry; see FINDINGS.md (K1) for the end-to-end evidence.

## 2026-10-19 — Pack-4/O2: the `[locale]/[slug]` catch-all prerendered pages that have their own route (fix)

**Problem.** `apps/techmirai-web/src/app/(frontend)/[locale]/[slug]/page.tsx` builds its static params from every document in the `pages` collection. A `pages` document with slug `assessment` exists (seed scaffolding), and the dedicated route `[locale]/assessment/page.tsx` generates the same two URLs. In a production build, `/ja/assessment` and `/en/assessment` were prerendered from the catch-all (`srcRoute: "/[locale]/[slug]"` in `.next/prerender-manifest.json`) and served that document's empty layout: an empty `<main>`, no `<h1>`, and the placeholder title `[TBD: Spec Free AI Website Assessment page title not yet seeded]` / `[JA TODO]`. The dev server hid it because dev does not prerender and routes to the static folder.

**Fix.** `generateStaticParams` skips slugs listed in `DEDICATED_ROUTE_SLUGS` (currently `assessment`). Runtime routing is unchanged: a static route folder still wins over the catch-all.

**Files.** `apps/techmirai-web/src/app/(frontend)/[locale]/[slug]/page.tsx` only (a new constant and one `.filter` condition). No database change, no reseed, no test change.

**Verification.** `pnpm typecheck` passes; `pnpm build` passes (105/105 pages); the manifest now lists `/en/assessment` and `/ja/assessment` with `srcRoute: "/[locale]/assessment"`; the prerendered HTML has one `<h1>` and the real titles ("Free AI Website Assessment — TechMirai", "無料AIホームページ診断｜TechMirai"); `pnpm a11y` passes on both routes; `e2e/seo.spec.ts` no longer fails them on `<h1>` count.

**Known limit.** The list is hand-maintained. Another dedicated route that also has a `pages` document would repeat the bug in production builds only. See `docs/O2-CODE-REVIEW.md` (medium 1).

**Status:** code changed, built and observed in a production build.

## 2026-10-20 — next/image allow-list now includes the custom R2 public URL (fix)

**Problem.** `apps/techmirai-web/next.config.ts` only allowed `*.r2.dev`, `*.r2.cloudflarestorage.com` and `imagedelivery.net`. When `NEXT_PUBLIC_R2_PUBLIC_URL` is a custom domain, `next/image` rejects every media URL (HTTP 400), so images load locally but not after deployment.

**Fix.** `remotePatternFromUrl()` parses `NEXT_PUBLIC_R2_PUBLIC_URL` and adds its protocol/host/port to `images.remotePatterns`. An unset or invalid value adds nothing.

**Files.** `apps/techmirai-web/next.config.ts` only.

**Status:** code changed; verification below in FINDINGS.md entry. Live behaviour unverified until redeployed with the R2 variables set.
