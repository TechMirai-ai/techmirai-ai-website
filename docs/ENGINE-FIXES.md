# Engine fixes

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
